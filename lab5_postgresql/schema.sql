-- lab5_postgresql/schema.sql

-- Удаление таблиц, если они существуют (для чистоты перезапуска)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Создание таблиц
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    stock_quantity INTEGER DEFAULT 0
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending'
);

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id),
    product_id INTEGER REFERENCES products(product_id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL
);

-- Вставка тестовых данных: Пользователи (3 пользователя для корректного ТОП-3)
INSERT INTO users (email, full_name) VALUES
    ('alice@example.com', 'Alice Smith'),
    ('bob@example.com', 'Bob Johnson'),
    ('charlie@example.com', 'Charlie Brown');

-- Вставка тестовых данных: Продукты (5 продуктов для разнообразия категорий)
INSERT INTO products (name, category, price, stock_quantity) VALUES
    ('Ноутбук', 'Электроника', 75000.00, 10),
    ('Мышь', 'Электроника', 1500.00, 50),
    ('Книга SQL', 'Книги', 2500.00, 30),
    ('Клавиатура', 'Электроника', 5000.00, 20),
    ('Книга NoSQL', 'Книги', 3000.00, 15);

-- Вставка тестовых данных: Заказы (минимум 3 заказа)
INSERT INTO orders (user_id, status, order_date) VALUES
    (1, 'completed', CURRENT_TIMESTAMP - INTERVAL '10 days'), -- Заказ Alice
    (2, 'completed', CURRENT_TIMESTAMP - INTERVAL '5 days'),  -- Заказ Bob
    (3, 'completed', CURRENT_TIMESTAMP - INTERVAL '2 days'),  -- Заказ Charlie
    (1, 'cancelled', CURRENT_TIMESTAMP - INTERVAL '35 days'); -- Отмененный старый заказ Alice (для чистоты логики)

-- Вставка тестовых данных: Позиции заказов (order_items)
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    -- Позиции для заказа 1 (Alice): общая сумма 78 000
    (1, 1, 1, 75000.00), -- Ноутбук x1
    (1, 2, 2, 1500.00),  -- Мышь x2
    -- Позиции для заказа 2 (Bob): общая сумма 2 500
    (2, 3, 1, 2500.00),  -- Книга SQL x1
    -- Позиции для заказа 3 (Charlie): общая сумма 13 000
    (3, 4, 2, 5000.00),  -- Клавиатура x2
    (3, 5, 1, 3000.00),  -- Книга NoSQL x1
    -- Позиции для заказа 4 (Старый отмененный заказ Alice)
    (4, 2, 1, 1500.00);