# Project Build Documentation

## Build Instructions for CodeStrike

Follow the steps below to set up the project locally.

## 1. Clone the Repository
1. Go to the [CodeStrike GitHub Repository](https://github.com/craigbsch/CodeStrike).
2. Click on the green **Code** button and copy the repository link.

## 2. Install Git (if not already installed)
- Download and install Git from [https://git-scm.com/downloads](https://git-scm.com/downloads).

## 3. Clone the Repository to Your Local Machine
In your terminal, type the following command:
```bash
git clone <repository-link>
```
Replace `<repository-link>` with the link you copied in Step 1.

## 4. Navigate to the backend folder in the Project Folder
Change directories to the backend folder:
```bash
cd CodeStrike
cd "codestrike backend"
```

## 5. Install Dependencies for backend
Run the following command to install all necessary Node.js packages for backend:
```bash
npm install
```

## 6. Install Docker Desktop (if not already installed)
- Download and install Docker Desktop from [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop).
- Open the Docker Desktop application.

## 7. Build the Docker Image
Run the following command to build the Docker image:
```bash
docker build -t docker_python:latest .
```

## 8. Start the backend
 Run the following command to start the backend:
 ```bash
    node app.js
 ```
# 9. In another terminal window, Navigate to the frontend Folder
Change directories to the frontend folder:
```bash
cd CodeStrike
cd "codestrike frontend"
```
## 10. Install Dependencies for frontend
Run the following command to install all necessary Node.js packages for frontend:
```bash
npm install
```
## 11. Start the frontend
 Run the following command to start the frontend:
 ```bash
npm run start
```

## 12. Access the Website
- The website should automatically open in your default browser.
- If it does not, navigate to the provided local server URL (e.g., `http://localhost:3000`).

This concludes the setup and build process. You should now see the CodeStrike website running locally!

