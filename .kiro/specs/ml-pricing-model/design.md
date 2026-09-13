# Design Document: ML Pricing Model

## Overview

The ML Pricing Model adds a lightweight machine learning regression layer on top of CampusPrint's existing rule-based cost calculator. It trains on historical completed orders to predict pricing and surfaces predictions to both students (before submission) and staff (on order detail). The model is implemented entirely in JavaScript/Node.js — no Python runtime is required — using a simple linear regression trained via gradient descent with the `ml-regression` npm library. This keeps the stack homogeneous and avoids a separate ML service.

The rule-based calculator remains the authoritative cost for billing; the ML model provides an informational estimate and confidence signal.

---

## Architecture

```mermaid
graph TD
  subgraph Frontend
    NOP[NewOrderPage] -->|GET /api/ml/predict| PE[Prediction Endpoint]
    SODP[StaffOrderDetailPage] -->|reads mlPrediction field| OD[Order Detail]
  end

  subgraph Backend API
    PE[/api/ml/predict] --> PV[Input Validator]
    PV --> FE[Feature Encoder]
    FE --> MI[Model Inference]
    MI --> CR[Confidence Resolver]

    TP[/api/ml/train  POST] --> DA[Data Extractor - Supabase]
    DA --> FP[Feature Preprocessor]
    FP --> TR[Linear Regression Trainer]
    TR --> MS[Model Serializer - JSON]
    MS --> MA[(model-artifact.json)]
  end

  subgraph Storage
    MA
    Supabase[(Supabase orders table)]
    DA --> Supabase
  end

  MI --> MA
```

**Key design decisions:**
- Single model artifact file (`model-artifact.json`) co-located with the backend, loaded into memory at startup.
- Training is triggered via an authenticated POST endpoint (staff/admin only), not a cron job, keeping infra simple.
- Confidence score is derived from the residual standard deviation of training errors — inputs near the training distribution get higher confidence.

---

## Components and Interfaces

### 1. Feature Encoder (`backend/src/ml/featureEncoder.js`)

Converts a raw order parameter object into a fixed-length numeric feature vector.

```
encodeFeatures(params) → number[]
```

| Input field  | Encoding                              |
|-------------|---------------------------------------|
| pages       | raw integer                           |
| copies      | raw integer                           |
| printType   | one-hot: bw=0, color=1               |
| binding     | ordinal: none=0, staple=1, spiral=2  |

Output: `[pages, copies, printTypeEncoded, bindingEncoded]` — a 4-element array.

**Pretty-printer:** `prettyPrintFeatureVector(vector) → string` — needed for round-trip testing.

### 2. Model Trainer (`backend/src/ml/modelTrainer.js`)

Runs the training pipeline against Supabase order history.

```
trainModel(orders) → ModelArtifact
```

- Filters orders to `status === 'collected'`
- Encodes features via `featureEncoder`
- Uses `SimpleLinearRegression` from `ml-regression` on page-weighted cost
- Computes residual std dev for confidence calibration
- Returns a `ModelArtifact` object

### 3. Model Serializer (`backend/src/ml/modelSerializer.js`)

```
serializeModel(artifact) → string        // JSON string
deserializeModel(json)   → ModelArtifact // rehydrated artifact
```

The serialized format is plain JSON so the round-trip property is verifiable without a binary parser.

**Pretty-printer:** `prettyPrintArtifact(artifact) → string` — used for display and testing.

### 4. Prediction Service (`backend/src/ml/predictionService.js`)

```
predict(featureVector, artifact) → { predictedPrice: number, confidence: number }
```

Confidence is `1 - clamp(residualStdDev / predictedPrice, 0, 1)` — gives a 0–1 score where lower spread = higher confidence.

### 5. Input Validator (`backend/src/ml/inputValidator.js`)

```
validatePredictionInput(body) → { valid: boolean, errors: string[] }
```

Enforces:
- `pages` and `copies` are integers ≥ 1
- `printType` ∈ `['bw', 'color']`
- `binding` ∈ `['none', 'staple', 'spiral']`

### 6. API Routes (`backend/src/routes/mlRoutes.js`)

| Method | Path            | Auth       | Description                          |
|--------|-----------------|------------|--------------------------------------|
| GET    | /api/ml/predict | None       | Returns price prediction + confidence|
| POST   | /api/ml/train   | Staff only | Triggers training pipeline           |
| GET    | /api/ml/status  | None       | Returns model load status + MAE      |

### 7. Frontend Price Preview (`frontend/src/components/PricePreview.jsx`)

A React component embedded in `NewOrderPage` that:
- Debounces calls to `/api/ml/predict` (300ms) as the student fills the form
- Shows ML price, confidence badge, and rule-based price side by side
- Degrades gracefully if the endpoint errors (shows rule-based only)

---

## Data Models

### Feature Vector

```js
// [pages, copies, printTypeEncoded, bindingEncoded]
// e.g. [10, 2, 1, 1] = 10 pages, 2 copies, color, staple
type FeatureVector = [number, number, number, number]
```

### Model Artifact

```js
{
  version: string,           // "1.0"
  trainedAt: string,         // ISO timestamp
  coefficients: number[],    // weights from regression
  intercept: number,
  residualStdDev: number,    // for confidence scoring
  trainingSetSize: number,
  mae: number                // MAE on training set
}
```

### Prediction Response

```js
{
  predictedPrice: number,   // ₹, rounded to 2 decimal places
  confidence: number,       // 0.0–1.0
  ruleBasedPrice: number,   // from existing costCalculator
  modelVersion: string,
  modelAvailable: boolean
}
```

### Training Response

```js
{
  success: boolean,
  trainingSetSize: number,
  mae: number,
  message: string
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

**Property 1: Valid input always returns a complete prediction response**

*For any* valid feature vector (pages ≥ 1, copies ≥ 1, printType ∈ ["bw","color"], binding ∈ ["none","staple","spiral"]), the prediction service SHALL return an object containing both `predictedPrice` (a finite positive number) and `confidence` (a number in [0.0, 1.0]).

**Validates: Requirements 1.2, 4.4**

---

**Property 2: Invalid inputs are always rejected with a 400 error**

*For any* input where at least one field violates the schema (pages or copies is missing, zero, negative, or non-integer; printType is not in ["bw","color"]; binding is not in ["none","staple","spiral"]), the input validator SHALL return `valid: false` with a non-empty errors array, and the endpoint SHALL respond with HTTP 400.

**Validates: Requirements 4.1, 4.2, 4.3**

---

**Property 3: Training pipeline filters to collected orders only**

*For any* list of orders with mixed statuses, the data extractor SHALL include only orders where `orderStatus === "collected"` in the training set, and SHALL exclude all others.

**Validates: Requirements 3.1**

---

**Property 4: Feature encoding produces a fully numeric vector**

*For any* valid order parameter object, `encodeFeatures` SHALL return an array of exactly 4 elements where every element is a finite number.

**Validates: Requirements 3.2**

---

**Property 5: Serialization round-trip is identity**

*For any* trained model artifact, serializing it to JSON and immediately deserializing it SHALL produce an artifact that generates numerically identical predictions for any valid feature vector.

**Validates: Requirements 3.3, 3.4, 5.3**

---

**Property 6: Override always applies the rule-based cost**

*For any* order in "received" status, triggering a staff override SHALL result in the order's final cost equaling the output of `calculateCost(printType, pages, copies, binding)`.

**Validates: Requirements 2.2**

---

**Property 7: Low confidence triggers visual indicator**

*For any* prediction response where `confidence < 0.5`, the `PricePreview` component SHALL render a low-confidence indicator element in the output.

**Validates: Requirements 1.4**

---

**Property 8: Training response always includes a numeric MAE**

*For any* training run on a dataset of 10 or more collected orders, the training response SHALL include a `mae` field that is a finite non-negative number.

**Validates: Requirements 5.1**

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Prediction endpoint called with no model loaded | Returns `modelAvailable: false`, `predictedPrice: null`, HTTP 200 (not an error — fallback is expected) |
| Fewer than 10 training samples | Returns HTTP 422 with `message: "insufficient data"` |
| Supabase unreachable during training | Returns HTTP 503 with descriptive message |
| Feature encoding receives unexpected type | Throws `FeatureEncodingError` caught by route handler → HTTP 400 |
| Model artifact JSON is corrupt on load | Logs warning, sets `modelAvailable: false`, prediction endpoint falls back gracefully |

All errors propagate through the existing `errorHandler.js` middleware. New error classes (`FeatureEncodingError`, `InsufficientDataError`) extend the standard `Error` with a `.status` field so the middleware handles them uniformly.

---

## Testing Strategy

### Property-Based Testing

The property-based testing library for this feature is **[fast-check](https://github.com/dubzzz/fast-check)** (JavaScript, well-maintained, works in Node.js without a build step).

Each property test runs a minimum of **100 iterations** using `fc.assert(..., { numRuns: 100 })`.

Each property-based test MUST be tagged with:
```
// Feature: ml-pricing-model, Property <N>: <property_text>
```

One property-based test per correctness property (Properties 1–8 above).

Property tests are co-located in `backend/src/ml/__tests__/` with `.test.js` suffix.

Generators:
- `fc.integer({ min: 1, max: 500 })` for pages and copies
- `fc.constantFrom('bw', 'color')` for printType
- `fc.constantFrom('none', 'staple', 'spiral')` for binding
- `fc.float({ min: 0, max: 1 })` for confidence values
- Invalid input generators use `fc.oneof(fc.string(), fc.constant(null), fc.integer({ max: 0 }))` for pages/copies

### Unit Tests

- `featureEncoder`: specific examples for each printType/binding combination
- `inputValidator`: boundary cases (pages=0, pages=1, empty string printType)
- `predictionService`: known input → expected output with a pre-trained fixture artifact
- `modelSerializer`: serialize/deserialize a hardcoded small artifact

### Integration Tests

- POST `/api/ml/train` with 15 synthetic collected orders → verify 200 + MAE field
- GET `/api/ml/predict` with valid params → verify response shape
- GET `/api/ml/predict` with invalid params → verify 400
- Staff override flow: create order → call override endpoint → verify cost equals rule-based cost
