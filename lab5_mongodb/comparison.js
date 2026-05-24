// lab5_mongodb/comparison.js

use shop_mongo;

print("--- Топ-3 пользователей по сумме затрат ---");
db.orders.aggregate([
    // Разворачиваем элементы заказа
    { $unwind: "$items" },
    
    // Группируем по пользователю и считаем его общие затраты
    {
        $group: {
            _id: "$user_id",
            total_spent: {
                $sum: { $multiply: ["$items.quantity", "$items.price"] }
            }
        }
    },
    
    // Сортируем по убыванию и берем троих лучших
    { $sort: { total_spent: -1 } },
    { $limit: 3 },
    
    // Подтягиваем данные о пользователе
    {
        $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user"
        }
    },
    { $unwind: "$user" },
    
    // Формируем финальный вид документа
    {
        $project: {
            _id: 0,
            user_id: "$_id",
            full_name: "$user.full_name",
            total_spent: 1
        }
    }
]).pretty();