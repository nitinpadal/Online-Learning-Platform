pipeline {
    agent any

    environment {
        // Define environment variables here
        VITE_SUPABASE_URL = "https://drxkyetzufqmpkngaetz.supabase.co"
        VITE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyeGt5ZXR6dWZxbXBrbmdhZXR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTU2OTMsImV4cCI6MjA2MDIzMTY5M30.0XTjyx38PhkAu5Y76cc2IRL4XuIngse5HJt8sqmbPMg"
    }

    stages {
        stage('Checkout Source Code') {
            steps {
                git credentialsId: 'github-credentials', 
                    url: 'https://github.com/nitinpadal/Online-Learning-Platform.git',
                    branch: 'main'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build Project') {
            steps {
                sh 'npm run build'
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
