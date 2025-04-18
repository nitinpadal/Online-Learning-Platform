pipeline {
    agent any

    environment {
        IMAGE_NAME = 'nitinpadal/online-learning-platform'
    }

    stages {
        stage('Clone Repo') {
            steps {
                git credentialsId: 'your-credentials-id',  // Replace with the Jenkins credential ID
                    url: 'https://github.com/nitinpadal/Online-Learning-Platform.git',
                    branch: 'main'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $IMAGE_NAME .'
            }
        }

        stage('Push to DockerHub') {
            steps {
                withDockerRegistry([ credentialsId: 'dockerhub-credentials-id', url: '' ]) {
                    sh 'docker push $IMAGE_NAME'
                }
            }
        }
    }
}
