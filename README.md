# CampusPrint

Digital Xerox & Stationery Ordering System for college campuses.

## Quick Start — Local Development (Docker Compose)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Node.js 20+ (for the React dev server only)

### 1. Clone and configure environment

```bash
git clone <repo-url>
cd campusprint
cp .env.example .env
```

Edit `.env` and set at minimum:
```
JWT_SECRET=any-random-secret
STAFF_USERNAME=admin
STAFF_PASSWORD=your-password
```

### 2. Start the backend + DynamoDB Local

```bash
docker compose up --build
```

This starts:
- **DynamoDB Local** on `http://localhost:8000`
- **Express backend** on `http://localhost:3001`

The backend automatically creates the `CampusPrint_Orders` DynamoDB table on first start.

### 3. Start the React frontend (separate terminal)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Default Staff Credentials
Username: `admin` (or whatever you set in `.env`)  
Password: `changeme` (or whatever you set in `.env`)

---

## Environment Variables

Copy `.env.example` to `.env`. All variables are required at startup; the server will exit with a clear error listing missing vars.

| Variable | Description |
|---|---|
| `PORT` | Backend port (default: 3001) |
| `DYNAMODB_ENDPOINT` | DynamoDB endpoint; omit for production AWS DynamoDB |
| `AWS_REGION` | AWS region (e.g. `ap-south-1`) |
| `AWS_ACCESS_KEY_ID` | AWS credentials (use `local` for DynamoDB Local) |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials (use `local` for DynamoDB Local) |
| `DYNAMODB_TABLE_ORDERS` | Orders table name |
| `STORAGE_BACKEND` | `local` (disk) or `s3` (Amazon S3) |
| `S3_BUCKET_NAME` | Required when `STORAGE_BACKEND=s3` |
| `LOCAL_UPLOAD_DIR` | Local upload path when `STORAGE_BACKEND=local` |
| `JWT_SECRET` | Secret for signing staff JWTs |
| `STAFF_USERNAME` | Staff login username |
| `STAFF_PASSWORD` | Staff login password |
| `FRONTEND_URL` | Frontend origin for CORS (e.g. `http://localhost:5173`) |

---

## AWS Deployment (ECR + ECS)

### Prerequisites
- AWS CLI configured (`aws configure`)
- An ECR repository created
- An ECS cluster and task-definition ready

### 1. Build and push Docker image to ECR

```bash
# Set your values
AWS_ACCOUNT_ID=123456789012
AWS_REGION=ap-south-1
ECR_REPO=campusprint-backend

# Authenticate Docker with ECR
aws ecr get-login-password --region $AWS_REGION \
  | docker login --username AWS \
    --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build
docker build -t $ECR_REPO ./backend

# Tag
docker tag $ECR_REPO:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest

# Push
docker push \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
```

### 2. Create / update ECS Task Definition

In your ECS task definition set the container image to:
```
<account_id>.dkr.ecr.<region>.amazonaws.com/campusprint-backend:latest
```

Add the following environment variables to the task definition (or use Secrets Manager / Parameter Store):
```
PORT=3001
AWS_REGION=ap-south-1
DYNAMODB_TABLE_ORDERS=CampusPrint_Orders
STORAGE_BACKEND=s3
S3_BUCKET_NAME=your-s3-bucket
JWT_SECRET=your-production-secret
STAFF_USERNAME=admin
STAFF_PASSWORD=your-secure-password
FRONTEND_URL=https://your-frontend-domain.com
```

Do **not** set `DYNAMODB_ENDPOINT` — omitting it makes the SDK connect to the real AWS DynamoDB.

### 3. Run the service on ECS

```bash
# Register task definition (after editing task-definition.json)
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json

# Create or update the ECS service
aws ecs update-service \
  --cluster campusprint-cluster \
  --service campusprint-backend \
  --task-definition campusprint-backend:LATEST \
  --force-new-deployment
```

### 4. Bootstrap DynamoDB table in production

Run once after first deploy:
```bash
# Port-forward to the running container or run via ECS exec
AWS_REGION=ap-south-1 \
DYNAMODB_TABLE_ORDERS=CampusPrint_Orders \
node backend/src/db/bootstrap.js
```

### 5. Deploy the React frontend

```bash
cd frontend
npm install
npm run build
# Upload the dist/ folder to S3 + CloudFront, Vercel, Netlify, etc.
```

---

## Project Structure

```
campusprint/
├── backend/
│   ├── src/
│   │   ├── db/          # DynamoDB client + table bootstrap
│   │   ├── middleware/  # auth, error handler, env validation
│   │   ├── models/      # Order model + pretty-printer
│   │   ├── routes/      # upload, orders, auth
│   │   └── services/    # costCalculator, orderService, uploadService
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Layout, ProtectedRoute
│   │   ├── context/     # ToastContext
│   │   ├── hooks/       # useToast
│   │   └── pages/       # all 7 route pages
│   └── package.json
├── .env.example
├── docker-compose.yml
└── README.md
```

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/upload` | — | Upload document (multipart/form-data, field: `file`) |
| POST | `/api/orders` | — | Create order, returns `{ orderId, cost, order }` |
| POST | `/api/orders/:id/pay` | — | Simulate payment |
| GET | `/api/orders/:id` | — | Fetch single order |
| GET | `/api/orders?studentContact=` | — | Student order history |
| GET | `/api/orders?status=&search=` | Staff JWT | Full order queue |
| PATCH | `/api/orders/:id/status` | Staff JWT | Update status / reject |
| POST | `/api/auth/login` | — | Staff login → JWT |
| GET | `/health` | — | Health check |
