<div align="center">

# 🍃 MongoDB — Часть 2

### Лабораторная работа №14 · Сравнение реляционной и документно-ориентированной моделей данных

<br/>

![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![MongoDB Atlas](https://img.shields.io/badge/MongoDB%20Atlas-Cloud-11AA52?style=for-the-badge&logo=mongodb&logoColor=white)
![Aggregation](https://img.shields.io/badge/Aggregation-Pipeline-FF6F00?style=for-the-badge&logo=mongodb&logoColor=white)
![NoSQL](https://img.shields.io/badge/NoSQL-Document_Model-8E44AD?style=for-the-badge)
![Indexing](https://img.shields.io/badge/Indexes-B--Tree-2E8B57?style=for-the-badge)

<br/>

> Часть 2 посвящена реализации той же предметной области интернет-магазина  
> в **документно-ориентированной модели MongoDB 7.0** с использованием  
> **вложенных документов**, **Aggregation Pipeline** и индексирования.

</div>

---

## 👤 Паспорт работы

| Параметр | Значение |
|---|---|
| **Студент** | Иванников Сергей Сергеевич |
| **Курс** | 2 курс |
| **Семестр** | 4 семестр |
| **Преподаватель** | Щеголев Алексей Алексеевич |

---

## 📁 Структура каталога

```text
lab5_mongodb/
├── init.js              # Инициализация БД, коллекций и документов
├── queries.js           # CRUD-операции и агрегационный пайплайн
├── comparison.js        # Пайплайн расчёта ТОП-3 пользователей
├── indexes.js           # Создание индексов
└── report/
    ├── 4.png            # Aggregation Pipeline по категориям
    └── 5.png            # Preview стадии $limit для ТОП-3 пользователей
```

---

## 1. Архитектура документной модели

В MongoDB предметная область интернет-магазина реализована уже не через таблицы и внешние ключи, а через **коллекции документов**. Основное архитектурное отличие состоит в том, что состав заказа хранится не в отдельной таблице `order_items`, а как **массив вложенных объектов `items` непосредственно внутри документа заказа**.

### Коллекции базы данных

| Коллекция | Назначение |
|---|---|
| `users` | Документы пользователей с базовыми данными и вложенным адресом |
| `products` | Документы товаров, включая дополнительные характеристики `specs` |
| `orders` | Документы заказов с массивом `items` |

### Принцип денормализации

В реляционной модели состав заказа вынесен в отдельную таблицу. В MongoDB он встроен внутрь документа:

```javascript
{
  _id: 1,
  user_id: 1,
  order_date: new Date(),
  status: "completed",
  items: [
    { product_id: 1, quantity: 1, price: 75000 },
    { product_id: 2, quantity: 2, price: 1500 }
  ]
}
```

### Преимущество такого подхода

Отказ от отдельной таблицы связей `order_items` позволяет:

- хранить заказ как логически завершённый документ;
- быстрее извлекать содержимое одного заказа;
- естественно представлять вложенные структуры;
- уменьшить число отдельных сущностей в схеме.

### Побочный эффект

Цена такой гибкости — рост денормализации и необходимость более сложных агрегационных конвейеров для аналитики, если требуется связывать `orders` с `products` и `users`.

---

## 2. Инициализация базы и документов

Файл `init.js` подготавливает базу `shop_mongo`, очищает старые коллекции и вставляет тестовые документы.

```javascript
use shop_mongo;
db.users.drop(); db.products.drop(); db.orders.drop();

db.users.insertMany([
    { _id: 1, email: "alice@example.com", full_name: "Alice Smith", created_at: new Date(), address: { city: "Moscow", street: "Tverskaya", zipcode: "101000" } },
    { _id: 2, email: "bob@example.com", full_name: "Bob Johnson", created_at: new Date(), address: { city: "Saint Petersburg", street: "Nevsky", zipcode: "191186" } },
    { _id: 3, email: "charlie@example.com", full_name: "Charlie Brown", created_at: new Date(), address: { city: "Kazan", street: "Baumana", zipcode: "420000" } }
]);
```

### Особенности модели

- В `users` присутствует вложенный документ `address`.
- В `products` некоторые товары имеют вложенный объект `specs`.
- В `orders` массив `items` хранит позиции заказа в одном документе.
- В данных изначально присутствует старый отменённый заказ Alice, что позже позволяет продемонстрировать особенности обработки и удаления документов.

---

## 3. CRUD и аналитика в MongoDB

### 3.1 READ — поиск заказов Alice с расчётом суммы

```javascript
db.orders.aggregate([
    { $lookup: { from: "users", localField: "user_id", foreignField: "_id", as: "user_info" } },
    { $unwind: "$user_info" },
    { $match: { "user_info.email": "alice@example.com" } },
    { $addFields: { total_amount: { $sum: { $map: { input: "$items", as: "item", in: { $multiply: ["$$item.quantity", "$$item.price"] } } } } } }
]);
```

### Разбор стадий

- `$lookup` присоединяет пользователя к заказу.
- `$unwind` превращает массив `user_info` в обычный вложенный объект.
- `$match` отбирает только заказы Alice.
- `$addFields` вычисляет `total_amount` на основе массива `items`.

---

### 3.2 UPDATE — добавление скидки к дорогим заказам

```javascript
db.orders.updateMany({}, [
    { $set: { total_amount: { $sum: { $map: { input: "$items", as: "item", in: { $multiply: ["$$item.quantity", "$$item.price"] } } } } } },
    { $set: { discount: { $cond: { if: { $gt: ["$total_amount", 80000] }, then: 10, else: 0 } } } },
    { $unset: "total_amount" }
]);
```

### Логика операции

Сначала временно вычисляется сумма заказа, затем через `$cond` выставляется скидка `10`, если сумма превышает `80000`, после чего временное поле удаляется через `$unset`.

---

### 3.3 DELETE — удаление старых отменённых заказов

```javascript
const thirtyDaysAgo = new Date(); 
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

db.orders.deleteMany({ status: "cancelled", order_date: { $lt: thirtyDaysAgo } });
```

Это удаляет заказы со статусом `cancelled`, дата которых старше 30 дней.

---

## 4. Подробный разбор Aggregation Pipeline

### 4.1 Аналитический отчёт по категориям

```javascript
db.orders.aggregate([
    { $unwind: "$items" },
    { $lookup: { from: "products", localField: "items.product_id", foreignField: "_id", as: "product_info" } },
    { $unwind: "$product_info" },
    { $group: { _id: "$product_info.category", total_sold: { $sum: "$items.quantity" }, total_revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }, avg_sale_price: { $avg: "$items.price" } } },
    { $sort: { total_revenue: -1 } },
    { $project: { _id: 0, category: "$_id", total_sold: 1, total_revenue: 1, avg_sale_price: { $round: ["$avg_sale_price", 2] } } }
]);
```

### Постадийный разбор

#### 1. `$unwind: "$items"`
Каждый заказ содержит массив `items`. Чтобы агрегировать по отдельным товарным позициям, MongoDB должна «развернуть» массив: одна позиция массива превращается в отдельный потоковый документ.

#### 2. `$lookup`
По `items.product_id` выполняется присоединение к коллекции `products`. Это аналог JOIN в SQL.

#### 3. Второй `$unwind`
После `$lookup` поле `product_info` является массивом. Его также нужно раскрыть в обычный объект.

#### 4. `$group`
Группировка выполняется по категории товара:
- `total_sold` — сумма количества проданных единиц;
- `total_revenue` — сумма выручки;
- `avg_sale_price` — средняя цена продажи.

#### 5. `$sort`
Группы сортируются по выручке в порядке убывания.

#### 6. `$project`
Финальное преобразование формирует аккуратный отчётный вид документа.

### Итоговый результат

| Категория | total_sold | total_revenue | avg_sale_price |
|---|---:|---:|---:|
| Электроника | 6 | 89500 | 20750 |
| Книги | 2 | 5500 | 2750 |

### Почему цифры отличаются от SQL

В MongoDB-результат по электронике равен `89500`, а не `83000`, потому что в агрегации учитывался также старый отменённый заказ Alice на мышь стоимостью `1500`, существовавший **до этапа выполнения DELETE**.

То есть:

- выполненные заказы по электронике: `83000`
- старый отменённый заказ: `1500`
- итог MongoDB: `89500`

Это подчёркивает, что результат в документной модели зависит не только от логики агрегации, но и от текущего состояния коллекции на момент выполнения конвейера.

Скриншот результата расположен в файле `report/4.png`.

---

### 4.2 ТОП-3 пользователей по сумме затрат

```javascript
db.orders.aggregate([
    { $unwind: "$items" },
    { $group: { _id: "$user_id", total_spent: { $sum: { $multiply: ["$items.quantity", "$items.price"] } } } },
    { $sort: { total_spent: -1 } },
    { $limit: 3 },
    { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $project: { _id: 0, user_id: "$_id", full_name: "$user.full_name", total_spent: 1 } }
]);
```

### Логика пайплайна

1. `$unwind` разрезает вложенные позиции заказов.
2. `$group` суммирует траты по `user_id`.
3. `$sort` сортирует пользователей по сумме затрат.
4. `$limit` оставляет только три первых результата.
5. `$lookup` присоединяет имена пользователей.
6. `$project` формирует итоговый вывод.

### Итоговый результат

| Место | Пользователь | total_spent |
|---|---|---:|
| 1 | Alice Smith | 79500 |
| 2 | Charlie Brown | 13000 |
| 3 | Bob Johnson | 2500 |

### Сопоставление с PostgreSQL

Результат бизнес-логически идентичен SQL-версии, но сумма Alice здесь выше на `1500`, поскольку включает старый отменённый заказ, ещё присутствовавший в коллекции на момент агрегации.

То есть:

- SQL: `78000`
- MongoDB: `79500 = 78000 + 1500`

Скриншот результата расположен в файле `report/5.png`.

---

## 5. Индексация в MongoDB

Файл `indexes.js` создаёт индекс по полю `user_id` в коллекции `orders`.

```javascript
use shop_mongo;
db.orders.createIndex({ "user_id": 1 });
db.orders.getIndexes();
```

### Практический смысл

Индекс по `user_id` ускоряет:

- выборку заказов конкретного пользователя;
- агрегации, в которых предварительно используются пользовательские фильтры;
- операции, завязанные на группировку или поиск по заказам пользователя.

MongoDB, как и PostgreSQL, применяет индексные структуры для уменьшения объёма сканируемых данных и сокращения времени доступа.

---

## 6. Вывод по документной части

MongoDB продемонстрировала гибкость представления данных и естественную работу со вложенными сущностями. Денормализованная структура позволила хранить заказ как единый документ вместе с его товарными позициями, что особенно удобно для сценариев чтения и сериализации. В то же время аналитика потребовала более сложного конвейера обработки, включающего `$unwind`, `$lookup`, `$group` и `$project`, что подчёркивает специфику NoSQL-подхода по сравнению с классическим SQL.

---

<div align="center">

**Лабораторная работа №15** · Технологии программирования  
СКФУ · Прикладная информатика в экономике · 2026  
Преподаватель: Щеголев Алексей Алексеевич

</div>