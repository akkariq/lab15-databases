// lab5_mongodb/init.js

// Переключение на базу данных
use shop_mongo;

// Очистка коллекций перед заполнением
db.users.drop();
db.products.drop();
db.orders.drop();

// 1. Создание и заполнение коллекции users (3 пользователя)
db.users.insertMany([
    {
        _id: 1,
        email: "alice@example.com",
        full_name: "Alice Smith",
        created_at: new Date(),
        address: { city: "Moscow", street: "Tverskaya", zipcode: "101000" }
    },
    {
        _id: 2,
        email: "bob@example.com", 
        full_name: "Bob Johnson",
        created_at: new Date(),
        address: { city: "Saint Petersburg", street: "Nevsky", zipcode: "191186" }
    },
    {
        _id: 3,
        email: "charlie@example.com",
        full_name: "Charlie Brown",
        created_at: new Date(),
        address: { city: "Kazan", street: "Baumana", zipcode: "420000" }
    }
]);

// 2. Создание и заполнение коллекции products (5 продуктов)
db.products.insertMany([
    {
        _id: 1,
        name: "Ноутбук",
        category: "Электроника",
        price: 75000,
        stock_quantity: 10,
        specs: { brand: "Lenovo", ram: "16GB", storage: "512GB SSD" }
    },
    {
        _id: 2,
        name: "Мышь",
        category: "Электроника",
        price: 1500,
        stock_quantity: 50
    },
    {
        _id: 3,
        name: "Книга SQL",
        category: "Книги",
        price: 2500,
        stock_quantity: 30,
        specs: { author: "Дмитрий К.", pages: 450 }
    },
    {
        _id: 4,
        name: "Клавиатура",
        category: "Электроника",
        price: 5000,
        stock_quantity: 20
    },
    {
        _id: 5,
        name: "Книга NoSQL",
        category: "Книги",
        price: 3000,
        stock_quantity: 15
    }
]);

// 3. Создание и заполнение коллекции orders с вложенным массивом items
db.orders.insertMany([
    {
        _id: 1,
        user_id: 1, // Alice
        order_date: new Date(),
        status: "completed",
        items: [
            { product_id: 1, quantity: 1, price: 75000 }, // Ноутбук
            { product_id: 2, quantity: 2, price: 1500 }   // Мышь x2
        ]
    },
    {
        _id: 2,
        user_id: 2, // Bob
        order_date: new Date(),
        status: "completed",
        items: [
            { product_id: 3, quantity: 1, price: 2500 }    // Книга SQL
        ]
    },
    {
        _id: 3,
        user_id: 3, // Charlie
        order_date: new Date(),
        status: "completed",
        items: [
            { product_id: 4, quantity: 2, price: 5000 },  // Клавиатура x2
            { product_id: 5, quantity: 1, price: 3000 }   // Книга NoSQL
        ]
    },
    {
        _id: 4,
        user_id: 1, // Старый отмененный заказ Alice (более 30 дней назад)
        order_date: new Date(new Date().setDate(new Date().getDate() - 35)),
        status: "cancelled",
        items: [
            { product_id: 2, quantity: 1, price: 1500 }
        ]
    }
]);