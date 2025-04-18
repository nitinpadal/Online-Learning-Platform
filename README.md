# Online Learning Platform

Welcome to the **Online Learning Platform** project repository. This platform allows students to browse, enroll in, and manage courses, while instructors can create and manage courses and assignments. It is built using **React**, **TypeScript**, **Tailwind CSS**, and **Supabase** for backend services like authentication and database management.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Setup and Installation](#setup-and-installation)
- [Usage](#usage)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Introduction

The **Online Learning Platform** aims to provide an easy-to-use digital solution for educational institutions. The platform enables students to access courses, enroll, view assignments, and interact with instructors. Instructors can manage course content, student enrollments, and assignments. The platform uses modern web technologies to provide a rich, responsive experience.

## Features

- **User Authentication**: Secure login and registration for both students and instructors using **Supabase Auth**.
- **Course Management**: Instructors can create, edit, delete, and manage courses.
- **Course Browsing**: Students can browse available courses and view course details.
- **Assignment Management**: Instructors can manage assignments and monitor student progress.
- **Code Playground**: Students can practice coding using a Monaco-based code editor (integrated with the platform).

## Technology Stack

- **Frontend**:
  - React 18 with TypeScript
  - Vite (for fast development builds)
  - Tailwind CSS (for styling)
  - React Router DOM (for routing)

- **Backend**:
  - Supabase (PostgreSQL, authentication, real-time database)

- **Development Tools**:
  - Node.js / npm
  - VS Code
  - ESLint (for code quality)

## Setup and Installation

### Prerequisites

Before you start, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (Version 14 or later)
- [npm](https://npmjs.com/) (Version 6 or later)

### Install Dependencies

1. Clone the repository to your local machine:

   ```bash
   git clone https://github.com/yourusername/online-learning-platform.git
   cd online-learning-platform
Install the project dependencies:npm install

Environment Variables
Create a .env file in the root of the project with the following environment variables:REACT_APP_SUPABASE_URL=<Your Supabase URL>
REACT_APP_SUPABASE_ANON_KEY=<Your Supabase Anon Key>

You can get these keys from your Supabase project.

REACT_APP_SUPABASE_URL=<Your Supabase URL>
REACT_APP_SUPABASE_ANON_KEY=<Your Supabase Anon Key>
Usage
To start the development server, run:npm run dev

Docker Setup
Build the Docker image:

docker build -t online-learning-platform .
Run the Docker container:

docker run -p 3000:3000 online-learning-platform
Build the Docker image:
docker build -t online-learning-platform .
Run the Docker container:
docker run -p 3000:3000 online-learning-platform
This will start the application inside a Docker container, and you can access it via http://localhost:3000.
