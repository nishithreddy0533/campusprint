# Implementation Plan

- [x] 1. Install dependencies and set up the ml module directory



  - Add `ml-regression` and `fast-check` to `backend/package.json`
  - Create `backend/src/ml/` directory with an index barrel file
  - Create `backend/src/ml/__tests__/` directory





  - _Requirements: 3.3_

- [ ] 2. Implement FeatureEncoder
- [ ] 2.1 Write `backend/src/ml/featureEncoder.js`
  - Implement `encodeFeatures(params)` returning a 4-element numeric array
  - Implement `prettyPrintFeatureVector(vector)` returning a JSON string
  - Encoding table: pages→raw, copies→raw, printType→(bw=0,color=1), binding→(none=0,staple=1,spiral=2)
  - _Requirements: 3.2_






- [ ]* 2.2 Write property test for feature encoding (Property 4)
  - **Property 4: Feature encoding produces a fully numeric vector**
  - Use `fc.integer({min:1,max:500})` for pages/copies, `fc.constantFrom` for categorical fields
  - Assert result length === 4 and every element is a finite number
  - Tag: `// Feature: ml-pricing-model, Property 4: Feature encoding produces a fully numeric vector`
  - **Validates: Requirements 3.2**

- [x] 3. Implement InputValidator





- [ ] 3.1 Write `backend/src/ml/inputValidator.js`
  - Implement `validatePredictionInput(body)` returning `{ valid, errors }`
  - Validate pages/copies as integers ≥ 1; printType ∈ ['bw','color']; binding ∈ ['none','staple','spiral']
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 3.2 Write property test for invalid input rejection (Property 2)
  - **Property 2: Invalid inputs are always rejected with a 400 error**
  - Generate inputs with at least one invalid field using `fc.oneof`
  - Assert `valid === false` and `errors.length > 0` for all generated invalid inputs





  - Tag: `// Feature: ml-pricing-model, Property 2: Invalid inputs are always rejected`
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 4. Implement ModelSerializer
- [ ] 4.1 Write `backend/src/ml/modelSerializer.js`
  - Implement `serializeModel(artifact)` returning a JSON string
  - Implement `deserializeModel(json)` returning a rehydrated ModelArtifact
  - Implement `prettyPrintArtifact(artifact)` returning a formatted JSON string



  - _Requirements: 3.3, 3.4_

- [ ]* 4.2 Write property test for serialization round-trip (Property 5)
  - **Property 5: Serialization round-trip is identity**
  - Generate random valid ModelArtifact objects using `fc.record`
  - Serialize then deserialize and verify `deserializeModel(serializeModel(artifact))` produces identical predictions for any valid feature vector
  - Tag: `// Feature: ml-pricing-model, Property 5: Serialization round-trip is identity`
  - **Validates: Requirements 3.3, 3.4, 5.3**

- [ ] 5. Implement PredictionService
- [ ] 5.1 Write `backend/src/ml/predictionService.js`
  - Implement `predict(featureVector, artifact)` returning `{ predictedPrice, confidence }`
  - Confidence formula: `1 - clamp(residualStdDev / predictedPrice, 0, 1)`
  - Round predictedPrice to 2 decimal places
  - _Requirements: 1.2, 4.4_

- [ ]* 5.2 Write property test for valid prediction response shape (Property 1)
  - **Property 1: Valid input always returns a complete prediction response**
  - Generate valid feature vectors; assert response contains finite `predictedPrice > 0` and `confidence` ∈ [0, 1]
  - Tag: `// Feature: ml-pricing-model, Property 1: Valid input always returns a complete prediction response`
  - **Validates: Requirements 1.2, 4.4**

- [x] 6. Implement ModelTrainer


- [x] 6.1 Write `backend/src/ml/modelTrainer.js`

  - Implement `filterCollectedOrders(orders)` to return only orders with `orderStatus === 'collected'`
  - Implement `trainModel(orders)` using `ml-regression` SimpleLinearRegression
  - Compute MAE on training set and include in returned ModelArtifact
  - Throw `InsufficientDataError` when fewer than 10 collected orders are present
  - _Requirements: 3.1, 3.2, 5.1, 5.2_

- [ ]* 6.2 Write property test for training filter (Property 3)
  - **Property 3: Training pipeline filters to collected orders only**
  - Generate arrays of orders with random `orderStatus` values using `fc.constantFrom`
  - Assert `filterCollectedOrders` returns only entries where `orderStatus === 'collected'`
  - Tag: `// Feature: ml-pricing-model, Property 3: Training pipeline filters to collected orders only`
  - **Validates: Requirements 3.1**

- [ ]* 6.3 Write property test for MAE presence after training (Property 8)
  - **Property 8: Training response always includes a numeric MAE**
  - Generate 10–50 synthetic collected orders; call `trainModel`; assert `artifact.mae` is a finite non-negative number
  - Tag: `// Feature: ml-pricing-model, Property 8: Training response always includes a numeric MAE`





  - **Validates: Requirements 5.1**

- [ ] 7. Wire up ML API routes
- [ ] 7.1 Write `backend/src/routes/mlRoutes.js`
  - Implement `GET /api/ml/predict`: validate input → encode → predict → respond with PredictionResponse shape

  - Implement `POST /api/ml/train`: extract collected orders from Supabase → train → serialize → save artifact → respond with TrainingResponse
  - Implement `GET /api/ml/status`: return model load status and MAE from loaded artifact








  - Handle `InsufficientDataError` → HTTP 422; validation errors → HTTP 400; Supabase errors → HTTP 503
  - _Requirements: 1.2, 1.3, 3.1, 3.5, 4.1, 4.2, 4.3, 5.1_

- [ ] 7.2 Register `mlRoutes` in `backend/src/app.js`
  - Import and mount mlRoutes at `/api/ml`
  - Load model artifact from disk at server startup; set `modelAvailable` flag
  - _Requirements: 1.2, 1.3_






- [ ] 8. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement staff override endpoint
- [ ] 9.1 Add `POST /api/orders/:orderId/override-price` route in the orders router
  - Accept requests only when `orderStatus === 'received'`
  - Recalculate cost using existing `calculateCost` and update order record in Supabase
  - Record `mlOverride: true` flag and `overrideAt` timestamp on the order
  - _Requirements: 2.2, 2.3_

- [ ]* 9.2 Write property test for override applying rule-based cost (Property 6)
  - **Property 6: Override always applies the rule-based cost**

  - Generate random order params; simulate override; assert final cost equals `calculateCost(printType, pages, copies, binding)`




  - Tag: `// Feature: ml-pricing-model, Property 6: Override always applies the rule-based cost`
  - **Validates: Requirements 2.2**





- [ ] 10. Build PricePreview frontend component
- [ ] 10.1 Create `frontend/src/components/PricePreview.jsx`
  - Accept `{ pages, copies, printType, binding }` as props
  - Debounce call to `/api/ml/predict` by 300ms
  - Display ML predicted price and rule-based price side by side
  - Show low-confidence badge when `confidence < 0.5`
  - Render fallback message if endpoint is unavailable
  - _Requirements: 1.1, 1.3, 1.4_

- [ ]* 10.2 Write property test for low-confidence indicator (Property 7)
  - **Property 7: Low confidence triggers visual indicator**
  - Generate `confidence` values; render PricePreview with mocked prediction; assert low-confidence element is present iff `confidence < 0.5`
  - Tag: `// Feature: ml-pricing-model, Property 7: Low confidence triggers visual indicator`
  - **Validates: Requirements 1.4**

- [ ] 10.3 Integrate PricePreview into `frontend/src/pages/NewOrderPage.jsx`
  - Pass current form field values to PricePreview as props
  - _Requirements: 1.1_

- [ ] 11. Update StaffOrderDetailPage to show ML prediction
  - Read `mlPrediction` and `confidence` fields from the order object
  - Display both rule-based cost and ML-predicted price with confidence score
  - Add "Override to Rule-Based Price" button that calls the override endpoint
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 12. Final Checkpoint — Ensure all tests pass, ask the user if questions arise.
