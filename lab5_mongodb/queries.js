// lab5_mongodb/queries.js

use shop_mongo;

// ==========================================
// B. CRUD-операции
// ==========================================

// 1. READ: Найти все заказы пользователя Alice с расчетом суммы заказа
print("--- Заказы пользователя Alice ---");
db.orders.aggregate([
    {
        $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user_info"
        }
    },
    { $unwind: "$user_info" },
    { $match: { "user_info.email": "alice@example.com" } },
    {
        $addFields: {
            total_amount: {
                $sum: {
                    $map: {
                        input: "$items",
                        as: "item",
                        in: { $multiply: ["$$item.quantity", "$$item.price"] }
                    }
                }
            }
        }
    }
]).pretty();


// 2. UPDATE: Добавить поле discount: 10 к заказам дороже 80000 руб.
print("--- Обновление скидок для заказов дороже 80000 ---");
db.orders.updateMany(
    {}, 
    [
        {
            $set: {
                total_amount: {
                    $sum: {
                        $map: {
                            input: "$items",
                            as: "item",
                            in: { $multiply: ["$$item.quantity", "$$item.price"] }
                        }
                    }
                }
            }
        },
        {
            $set: {
                discount: {
                    $cond: { if: { $gt: ["$total_amount", 80000] }, then: 10, else: 0 }
                }
            }
        },
        { $unset: "total_amount" } // удаляем временное поле расчета суммы
    ]
);


// 3. DELETE: Удалить заказы со статусом "cancelled" старше 30 дней
print("--- Удаление старых отмененных заказов ---");
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

db.orders.deleteMany({
    status: "cancelled",
    order_date: { $lt: thirtyDaysAgo }
});


// ==========================================
// C. Агрегационный пайплайн (Отчёт по категориям)
// ==========================================
print("--- Аналитический отчёт по категориям товаров ---");
db.orders.aggregate([
    // Шаг 1: Развернуть массив items
    { $unwind: "$items" },
    
    // Шаг 2: Соединить с коллекцией products
    {
        $lookup: {
            from: "products",
            localField: "items.product_id",
            foreignField: "_id",
            as: "product_info"
        }
    },
    { $unwind: "$product_info" },
    
    // Шаг 3: Группировка по названию категории с вычислением метрик
    {
        $group: {
            _id: "$product_info.category",
            total_sold: { $sum: "$items.quantity" },
            total_revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
            avg_sale_price: { $avg: "$items.price" }
        }
    },
    
    // Шаг 4: Сортировка по убыванию выручки
    { $sort: { total_revenue: -1 } },
    
    // Шаг 5: Проекция (Форматирование вывода под требования отчета)
    {
        $project: {
            _id: 0,
            category: "$_id",
            total_sold: 1,
            total_revenue: 1,
            avg_sale_price: { $round: ["$avg_sale_price", 2] }
        }
    }
]).pretty();