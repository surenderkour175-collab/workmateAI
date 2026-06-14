import os
import json
import logging
import uuid
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("workmate_ai")

class LocalJSONDatabase:
    """Fallback database in case MongoDB is unavailable"""
    def __init__(self):
        self.filepath = os.path.join(os.path.dirname(settings.UPLOAD_DIR), "db_fallback.json")
        if not os.path.exists(self.filepath):
            with open(self.filepath, "w") as f:
                json.dump({"meetings": [], "documents": []}, f, indent=2)
        logger.info(f"Local fallback JSON database initialized at {self.filepath}")

    def _read(self):
        try:
            with open(self.filepath, "r") as f:
                return json.load(f)
        except Exception:
            return {"meetings": [], "documents": []}

    def _write(self, data):
        try:
            with open(self.filepath, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Error writing to fallback database: {e}")

    def insert_one(self, collection: str, document: dict) -> dict:
        data = self._read()
        if collection not in data:
            data[collection] = []
        
        # Ensure _id is present
        if "_id" not in document:
            document["_id"] = str(uuid.uuid4())
        else:
            document["_id"] = str(document["_id"])
            
        data[collection].append(document)
        self._write(data)
        return document

    def find(self, collection: str, query: dict = None) -> list:
        data = self._read()
        items = data.get(collection, [])
        if not query:
            return items
        
        # Simple exact match query helper
        filtered = []
        for item in items:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                filtered.append(item)
        return filtered

    def find_one(self, collection: str, query: dict) -> dict:
        items = self.find(collection, query)
        return items[0] if items else None

    def update_one(self, collection: str, query: dict, update: dict) -> bool:
        data = self._read()
        items = data.get(collection, [])
        updated = False
        
        set_fields = update.get("$set", {})
        
        for idx, item in enumerate(items):
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                for k, v in set_fields.items():
                    item[k] = v
                items[idx] = item
                updated = True
                break
                
        data[collection] = items
        self._write(data)
        return updated

    def delete_one(self, collection: str, query: dict) -> bool:
        data = self._read()
        items = data.get(collection, [])
        new_items = []
        deleted = False
        
        for item in items:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match and not deleted:
                deleted = True
                continue
            new_items.append(item)
            
        data[collection] = new_items
        self._write(data)
        return deleted

class DatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.is_fallback = False
        self.fallback_db = None

        try:
            logger.info(f"Connecting to MongoDB at {settings.MONGO_URI}...")
            self.client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=2000)
            self.client.server_info() # Trigger connection check
            self.db = self.client.get_default_database()
            logger.info("Connected successfully to MongoDB.")
        except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
            logger.warning(f"MongoDB connection failed: {e}. Falling back to Local JSON Database.")
            self.is_fallback = True
            self.fallback_db = LocalJSONDatabase()

    def get_collection(self, name: str):
        if self.is_fallback:
            class MockCollection:
                def __init__(self, manager, name):
                    self.manager = manager
                    self.name = name
                def insert_one(self, doc):
                    import copy
                    doc_copy = copy.deepcopy(doc)
                    res = self.manager.fallback_db.insert_one(self.name, doc_copy)
                    class InsertResult:
                        def __init__(self, inserted_id):
                            self.inserted_id = inserted_id
                    return InsertResult(res["_id"])
                def find(self, query=None):
                    return self.manager.fallback_db.find(self.name, query)
                def find_one(self, query):
                    return self.manager.fallback_db.find_one(self.name, query)
                def update_one(self, query, update):
                    # update can be dict
                    class UpdateResult:
                        def __init__(self, modified_count):
                            self.modified_count = modified_count
                    success = self.manager.fallback_db.update_one(self.name, query, update)
                    return UpdateResult(1 if success else 0)
                def delete_one(self, query):
                    class DeleteResult:
                        def __init__(self, deleted_count):
                            self.deleted_count = deleted_count
                    success = self.manager.fallback_db.delete_one(self.name, query)
                    return DeleteResult(1 if success else 0)
            return MockCollection(self, name)
        else:
            return self.db[name]

db_manager = DatabaseManager()
# Export collections
meetings_collection = db_manager.get_collection("meetings")
documents_collection = db_manager.get_collection("documents")
