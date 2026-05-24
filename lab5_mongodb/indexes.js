// lab5_mongodb/indexes.js

use shop_mongo;

// Создание индекса по user_id для оптимизации $lookup и выборок по пользователям
db.orders.createIndex({ "user_id": 1 });

print("--- Список текущих индексов для коллекции orders ---");
db.orders.getIndexes();