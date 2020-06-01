# Express 7 Quest - POST&PUT

This application provides a simple API for user management.

**Follow the instructions below!**

## 1. Get it

Clone this repo:

```
git clone https://github.com/WildCodeSchool/quest-express-post-put.git
````

## 2. Install the dependencies

```
cd quest-express-post-put
npm install
```

## 3. Setup the database

Inject the `database/setup-database.sql` file into MySQL with this command (provide your root password when asked to):

```
mysql -uroot -p < database/setup-database.sql
```

## 4. Create and edit the `.env` file

This application uses [dotenv](https://www.npmjs.com/package/dotenv), which allows to load variables from a specific file: `.env`. This is where sensitive data, such as database settings, JWT secret key, API keys, etc. are stored.

This file is **not** provided here, because it should **never** be committed! However, the `.env.sample` file will help create you quickly.

First, **copy it** as `.env`:

```
cp .env.sample .env
```

Second, **edit** `.env`. **You only have to replace the value behind `DB_PASS=`** with your own root password.
