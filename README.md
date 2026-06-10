# National Football League Management System (SE104_UIT)

A full-stack web application designed to comprehensively manage a football league. This system allows administrators to handle seasons, teams, players, match schedules, results, and rankings in a detailed and automated manner.

## 📸 Application Screenshots

Here are some screenshots showcasing the main features of the application.

| Home Page | Team Ranking | Player Ranking |
| :---: | :---: | :---: |
| ![Home Page](images/trangchu.png) | ![Team Ranking](images/bxhdoibong.png) | ![Player Ranking](images/bxhcauthu.png) |

| Team Management | Player Management | Match Management |
| :---: | :---: | :---: |
| ![Team Management](images/doibong.png) | ![Player Management](images/cauthu.png) | ![Match Management](images/trandau.png) |

| Season Management | Regulation Management |
| :---: | :---: |
| ![Season Management](images/muagiai.png) | ![Regulation Management](images/quydinh.png) |

## ✨ Key Features

The project provides a robust set of features for league management:

-   **Season Management**: Create, update, and delete seasons with specific start and end dates.
-   **Team Management**: Add teams to a season, manage information like stadium, coach, and logo.
-   **Player Management**: Add players to teams, respecting regulations on age, maximum players per team, and maximum foreign players.
-   **Flexible Regulations**: Define rules for each season, including:
    -   Player age and quantity rules.
    -   Match format rules (e.g., number of rounds).
    -   Scoring and ranking criteria (goal difference, head-to-head, etc.).
-   **Automatic Schedule Generation**: The system can automatically create a full match schedule based on the registered teams in a season.
-   **Match Result Updates**: Update match scores and record goal details (scorer, minute, goal type).
-   **Automatic Ranking Calculation**:
    -   Team rankings are automatically updated after each match result is entered.
    -   Player rankings (top scorers) are also updated automatically.
-   **User Authentication**: Secure registration and login for administrators to perform management tasks.

## 🛠️ Technology Stack

### Backend
-   **Node.js & Express.js**: Platform and framework for building the API.
-   **MongoDB & Mongoose**: NoSQL database and ODM for data storage and modeling.
-   **JSON Web Token (JWT)**: For securing API endpoints.
-   **bcryptjs**: For password hashing.
-   **Zod**: For data validation.
-   **Swagger & YAML**: For API documentation.

### Frontend
-   **React & Vite**: Library and build tool for the user interface.
-   **Tailwind CSS**: For utility-first styling.
-   **Axios**: For making HTTP requests to the backend API.
-   **React Router**: For client-side routing.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
-   Node.js (v22.x is specified in `backend/package.json`).
-   npm or yarn
-   MongoDB
-   A code editor (like Visual Studio Code)

### Installation and Setup

1.  **Clone the repository**:
    ```bash
    git clone [https://github.com/truonghoangkhiem/QL_Giai_BD_QG_SE104_UIT.git](https://github.com/truonghoangkhiem/QL_Giai_BD_QG_SE104_UIT.git)
    cd QL_Giai_BD_QG_SE104_UIT
    ```

2.  **Backend Setup**:
    -   Navigate to the `backend` directory: `cd backend`
    -   Install dependencies: `npm install`
    -   Create a `.env` file in the `backend` directory and add your environment variables:
        ```env
        MONGODB_URI=mongodb://127.0.0.1:27017/quan_ly_bong_da
        DATABASE_NAME=quan_ly_bong_da
        JWT_SECRET=your_super_secret_jwt_key
        PORT=5000
        ```
    -   **Seed Database**:
        ```bash
        node scripts/seed.js
        ```
        *(This command will automatically connect to your local MongoDB, drop existing data, and seed a complete mock dataset including an admin account `admin@gmail.com` / `admin123`, seasons like V-League, Premier League, Champions League, World Cup, clubs, players, regulations, matches, and automatic standings).*
    -   Start the backend server: `npm run dev`
    -   The backend will be running on `http://localhost:5000`.

3.  **Frontend Setup**:
    -   Navigate to the `frontend` directory: `cd ../frontend`
    -   Install dependencies: `npm install`
    -   Start the frontend development server: `npm run dev`
    -   The frontend will be running on `http://localhost:5173` (or `http://localhost:5174` if port 5173 is already in use).

## 🗄️ Database Management & Seeding

The project uses **MongoDB** for data storage. For quick testing and trial runs, a rich mock dataset is integrated out-of-the-box (including 96 matches, standings, regulations, clubs, and players for V-League, Premier League, Champions League, World Cup, etc.).

### 1. Database Seeding & Resetting
After configuring your `.env` connection variables in the `backend` folder, run the following command from the `backend` directory:
```bash
node scripts/seed.js
```
**What this script does:**
* Automatically connects to MongoDB and creates the database if it doesn't exist.
* Cleans up all existing data (if any) to prevent data corruption or conflicts.
* Creates a default administrator account:
  * **Email:** `admin@gmail.com`
  * **Password:** `admin123`
* Populates mock seasons: V-League (2025, 2026, 2027), Premier League, Serie A, La Liga, UEFA Champions League, and FIFA World Cup 2026 along with matching match schedules, scores, lineups, goals, and team/player rankings.

### 2. Changing the Database Name
If you want to use a different database name (e.g., `quan_ly_bong_da_test` or `quan_ly_bong_da_dev`):
1. Open the `backend/.env` file.
2. Edit the database name suffix at the end of the `MONGODB_URI` connection string and the `DATABASE_NAME` variable:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/your_custom_db_name
   DATABASE_NAME=your_custom_db_name
   ```
3. Run the seeding script again: `node scripts/seed.js` in the `backend` folder. MongoDB will automatically provision the new database name and populate it with the mock dataset.

## 📄 API Documentation

API documentation is available via Swagger UI. Once the backend server is running, you can access it at:
[http://localhost:5000/api-docs](http://localhost:5000/api-docs)

## 👤 Contact

-   **Author**: Truong Hoang Khiem
-   **Email**: truongkhiemhoang@gmail.com

## ⚖️ License

This project is licensed under the MIT License. See the `LICENSE` file for details.npm run dev