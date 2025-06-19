# Base stage for dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json ./
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 4 && \
    npm install

# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED 1

# These ARGs will be provided by Coolify at build time
# They are needed during the build process for Next.js
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ARG NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_AVATAR
ARG NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_AUDIO
ARG NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_VIDEO
ARG NEXT_PUBLIC_CLOUDINARY_API_KEY
ARG SUPABASE_SERVICE_ROLE_KEY

# Pass build ARGs as ENV variables during build time
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=${NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}
ENV NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_AVATAR=${NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_AVATAR}
ENV NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_AUDIO=${NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_AUDIO}
ENV NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_VIDEO=${NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_VIDEO}
ENV NEXT_PUBLIC_CLOUDINARY_API_KEY=${NEXT_PUBLIC_CLOUDINARY_API_KEY}
ENV SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

RUN echo "Build-time NEXT_PUBLIC_SUPABASE_URL: $NEXT_PUBLIC_SUPABASE_URL" && \
    echo "Build-time NEXT_PUBLIC_SUPABASE_ANON_KEY: $NEXT_PUBLIC_SUPABASE_ANON_KEY" && \
    echo "Build-time SUPABASE_SERVICE_ROLE_KEY: $SUPABASE_SERVICE_ROLE_KEY" && \
    echo "Build-time NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: $NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"

# Build the application with environment variables available
RUN npm run build

# Runner stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user to run the app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy build output and necessary files
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./

# Set proper permissions
USER nextjs

# Expose the port the app will run on
EXPOSE 3000

# Runtime environment variables (will be injected by Coolify at runtime)
ENV PORT 3000


# Start the application
CMD ["npm", "start"]
