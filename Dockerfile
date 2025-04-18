# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json and install dependencies
# Use npm install as package-lock.json might not be present/consistent
COPY package.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Set build-time args for Supabase keys (can be placeholders)
# These are embedded at build time by Vite. For runtime config, see nginx.conf and entrypoint approach (more complex)
# If you need runtime config, you'd typically replace these with placeholders and use an entrypoint script
# For simplicity here, we assume build-time embedding is acceptable OR you handle runtime config separately.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

# Build the application
# Ensure all required env vars are present during build
RUN echo "VITE_SUPABASE_URL=${VITE_SUPABASE_URL}" >> .env
RUN echo "VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}" >> .env
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:1.25-alpine

# Copy the build output from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
