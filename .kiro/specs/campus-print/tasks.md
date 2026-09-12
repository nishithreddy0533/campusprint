# Implementation Plan — CampusPrint

- [x] 1. Project scaffold and environment setup


  - Initialize monorepo with `backend/` and `frontend/` directories
  - Set up `backend/` as a Node.js 20 ESM project with Express, `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `multer`, `uuid`, `jsonwebtoken`, `fast-check`, `vitest`
  - Set up `frontend/` with Vite + React 18 + Tailwind CSS + React Router v6
  - Create `.env.example` listing all required env vars with placeholder values
  - Create `backend/src/middleware/validateEnv.js` that reads required keys and calls `process.exit(1)` with a clear message if any are missing
  - _Requirements: 9.4, 10.1_




- [x] 2. DynamoDB client and table bootstrap


  - [x] 2.1 Implement `backend/src/db/dynamoClient.js`

    - Export a `DocumentClient` factory that reads `DYNAMODB_ENDPOINT` (if set) and `AWS_REGION` from env


    - _Requirements: 10.3_
  - [ ] 2.2 Implement `backend/src/db/bootstrap.js`
    - Script to `CreateTable` for `CampusPrint_Orders` (PK: `orderId`) and its `StudentContactIndex` GSI if they do not already exist
    - _Requirements: 10.3_

- [x] 3. Cost calculator service

  - [x] 3.1 Implement `backend/src/services/costCalculator.js`


    - Pure function `calculateCost(printType, pages, copies, binding)` using the exact formula from the design
    - _Requirements: 2.2_
  - [ ]* 3.2 Write property-based test for cost calculator
    - File: `backend/src/services/costCalculator.property.test.js`
    - Use `fast-check` with 500 iterations
    - **Feature: campus-print, Property 1: Cost calculation is deterministic and formula-correct**
    - **Validates: Requirements 2.2**




- [ ] 4. Order data model and serialization utilities
  - [x] 4.1 Implement `backend/src/models/order.js`


    - Define the Order schema shape, `createOrderObject()` factory, and `prettyPrintOrder(order)` function
    - `prettyPrintOrder` returns a human-readable JSON string
    - _Requirements: 11.1, 11.2_
  - [ ]* 4.2 Write property-based test for order JSON round-trip
    - File: `backend/src/models/order.property.test.js`
    - Use `fast-check` to generate random valid Order objects; assert `JSON.parse(prettyPrintOrder(order))` deep-equals the original
    - **Feature: campus-print, Property 2: Order JSON serialization round-trip**
    - **Validates: Requirements 11.1, 11.3**




- [ ] 5. Upload service and route
  - [ ] 5.1 Implement `backend/src/services/uploadService.js`
    - Abstract over `STORAGE_BACKEND=local` (write to `LOCAL_UPLOAD_DIR`) and `STORAGE_BACKEND=s3` (upload to S3 bucket via `@aws-sdk/client-s3`)
    - Return a stable `fileUrl` string for both backends
    - _Requirements: 1.4, 1.5, 10.2_
  - [ ] 5.2 Implement `backend/src/routes/upload.js`
    - `POST /api/upload` using `multer` for multipart parsing
    - Server-side MIME type validation (PDF, JPEG, PNG, DOC, DOCX) and 20 MB size limit
    - Return `{ fileUrl }` on success; `400` on type/size violation
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [ ]* 5.3 Write property-based test for upload file URL stability
    - File: `backend/src/services/uploadService.property.test.js`
    - For any valid file buffer, calling the local-storage upload returns a non-empty string that is preserved when stored on an order
    - **Feature: campus-print, Property 8: Uploaded file URL is stable and retrievable**
    - **Validates: Requirements 1.4**




- [ ] 6. Order service — CRUD against DynamoDB
  - [ ] 6.1 Implement `backend/src/services/orderService.js`
    - `createOrder(data)` — validates required fields, computes cost, persists to DynamoDB, returns saved order
    - `getOrderById(orderId)` — returns order or `null`
    - `getOrdersByContact(studentContact)` — queries GSI, returns sorted array
    - `updateOrderStatus(orderId, newStatus, extra)` — validates transition rules, updates DynamoDB
    - `confirmPayment(orderId)` — flips `paymentStatus` to `paid`
    - _Requirements: 2.1, 2.4, 3.1, 4.1, 5.1, 7.1_
  - [ ]* 6.2 Write property-based test for invalid order input rejection
    - File: `backend/src/services/orderService.property.test.js`
    - Use `fast-check` to generate order inputs with `pages < 1`, `copies < 1`, or missing required fields; assert all throw/return validation errors
    - **Feature: campus-print, Property 3: Invalid order inputs are always rejected**
    - **Validates: Requirements 2.3**
  - [ ]* 6.3 Write property-based test for payment idempotency
    - Same file as 6.2 or separate `payment.property.test.js`
    - For any order with `paymentStatus === 'paid'`, calling `confirmPayment` again returns an error without mutating the order

    - **Feature: campus-print, Property 4: Payment idempotency / state guard**


    - **Validates: Requirements 3.3**







- [ ] 7. Status transition enforcement
  - [ ] 7.1 Implement transition validation in `orderService.js`
    - Valid transitions: `received → processing`, `processing → ready`, `ready → collected`, `any → rejected`
    - Guard: `received → processing` blocked when `paymentStatus === 'pending'`
    - Rejection guard: `rejectionReason` must be non-empty and non-whitespace
    - _Requirements: 7.1, 7.2, 7.3_
  - [x]* 7.2 Write property-based test for status transitions


    - File: `backend/src/services/statusTransition.property.test.js`
    - Generate all (currentStatus, newStatus) pairs; assert only valid transitions succeed
    - **Feature: campus-print, Property 5: Staff status transitions are strictly enforced**
    - **Validates: Requirements 7.1, 7.5**

  - [ ]* 7.3 Write property-based test for processing gate
    - For any order with `paymentStatus === 'pending'`, transition to `processing` always returns an error


    - **Feature: campus-print, Property 6: Processing gate — payment must be confirmed**
    - **Validates: Requirements 7.2**
  - [ ]* 7.4 Write property-based test for rejection reason
    - For any whitespace-only or absent `rejectionReason`, rejection always returns an error

    - **Feature: campus-print, Property 7: Rejection requires a non-empty reason**




    - **Validates: Requirements 7.3**

- [x] 8. Auth middleware and staff login route

  - [x] 8.1 Implement `backend/src/middleware/authMiddleware.js`


    - Verify `Authorization: Bearer <jwt>` header; return 401 on missing or invalid token
    - _Requirements: 8.3_
  - [x] 8.2 Implement `backend/src/routes/auth.js`



    - `POST /api/auth/login` — compare body credentials to `STAFF_USERNAME` / `STAFF_PASSWORD` env vars; return signed JWT on match, 401 on mismatch


    - _Requirements: 8.1, 8.2_

- [ ] 9. Order API routes
  - Implement `backend/src/routes/orders.js` wiring all order endpoints to `orderService`:


    - `POST /api/orders` — create order (calls cost calculator + orderService.createOrder)
    - `POST /api/orders/:orderId/pay` — confirm payment
    - `GET /api/orders/:orderId` — fetch single order
    - `GET /api/orders?studentContact=` — student history
    - `GET /api/orders?status=&search=` (staff, behind `authMiddleware`) — full queue with filter/search
    - `PATCH /api/orders/:orderId/status` (staff, behind `authMiddleware`) — update status or reject


  - Apply proper 400/404/500 error responses for each route
  - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.1, 6.2, 6.3, 7.1, 9.1, 9.2, 9.3_

- [ ] 10. Express app assembly and global error handler
  - Wire all routes into `backend/src/app.js`
  - Implement `backend/src/middleware/errorHandler.js` — catch-all Express error handler that returns structured JSON and logs full error server-side

  - Call `validateEnv` before server start in `backend/src/server.js`
  - _Requirements: 9.1, 9.2, 9.3, 9.4_



- [ ] 11. Checkpoint — backend tests and server startup
  - Ensure all tests pass, ask the user if questions arise.



- [ ] 12. React frontend — shared layout and routing
  - Set up `frontend/src/main.jsx`, `App.jsx` with React Router v6 routes for all 7 pages
  - Create a shared `Layout` component with a top nav bar and toast/notification container
  - Implement a `useToast` hook for in-app banner notifications
  - _Requirements: 4.4_

- [ ] 13. Landing page and new order flow
  - [ ] 13.1 Implement `LandingPage` (`/`) with student and staff entry buttons
  - [ ] 13.2 Implement `NewOrderPage` (`/order/new`) as a multi-step form
    - Step 1: file upload (calls `POST /api/upload`, shows validation errors)
    - Step 2: print specs (printType, pages, copies, binding, specialInstructions)
    - Step 3: cost preview (fetches server-computed cost from `POST /api/orders`)
    - Step 4: payment confirmation (calls `POST /api/orders/:orderId/pay`, shows token)
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.4_

- [ ] 14. Order tracking and history pages
  - [ ] 14.1 Implement `OrderTrackingPage` (`/order/:orderId`)
    - Poll `GET /api/orders/:orderId` every 3 seconds
    - Display current status with a visual progress indicator
    - Show prominent in-app notification banner when status is `ready`
    - _Requirements: 4.1, 4.3, 4.4_
  - [ ] 14.2 Implement `MyOrdersPage` (`/my-orders`)
    - Contact entry form; fetch `GET /api/orders?studentContact=`; list orders with link to tracking page
    - Token lookup input that fetches `GET /api/orders/:orderId`
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 15. Staff login and protected routing
  - Implement `StaffLoginPage` (`/staff/login`) — calls `POST /api/auth/login`, stores JWT in `sessionStorage`
  - Implement a `ProtectedRoute` wrapper that redirects to `/staff/login` if no JWT present
  - Wrap all `/staff/*` routes with `ProtectedRoute`
  - _Requirements: 8.1, 8.2_

- [ ] 16. Staff dashboard
  - Implement `StaffDashboardPage` (`/staff/dashboard`)
    - Fetch `GET /api/orders` with JWT; display sortable table newest-first
    - Filter controls: status dropdown, search input (token / student name)
    - Pagination: 20 rows per page with Previous/Next controls when > 50 orders
    - Show estimated completion time per row
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 17. Staff order detail page
  - Implement `StaffOrderDetailPage` (`/staff/orders/:orderId`)
    - Display full order details including document link and all printing requirements
    - Status update dropdown restricted to valid next states; "Update" button calls `PATCH /api/orders/:orderId/status`
    - Reject form with required reason field
    - Show 400/404 API error messages inline
    - _Requirements: 6.5, 7.1, 7.2, 7.3, 7.4_

- [ ] 18. Checkpoint — full frontend and end-to-end flow
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Docker and deployment artifacts
  - Write `backend/Dockerfile` — multi-stage Node.js 20 build
  - Write `docker-compose.yml` — backend + DynamoDB Local services, mounts `.env` file
  - Write `README.md` — local `docker-compose up` instructions, Vite dev server instructions, and AWS ECR push + ECS run steps
  - _Requirements: 10.4, 10.5, 10.6_

- [ ] 20. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.
