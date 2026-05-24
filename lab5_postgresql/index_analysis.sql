-- lab5_postgresql/index_analysis.sql

-- Шаг 1: Анализ плана выполнения ДО создания индекса
EXPLAIN ANALYZE 
SELECT * FROM order_items WHERE order_id = 1;

-- Шаг 2: Создание индекса для ускорения поиска по внешнему ключу order_id
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Шаг 3: Анализ плана выполнения ПОСЛЕ создания индекса
EXPLAIN ANALYZE 
SELECT * FROM order_items WHERE order_id = 1;