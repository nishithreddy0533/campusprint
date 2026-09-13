# Requirements Document

## Introduction

This feature adds a machine learning-based dynamic pricing model to CampusPrint. The current pricing uses a fixed rule-based calculator (₹2/page B&W, ₹8/page color, flat binding fees). The ML model will learn from historical order data to predict a fair, demand-aware price estimate, and surface that estimate to students before they submit an order. Staff can also view pricing confidence scores and override suggestions. The model is trained on-demand using accumulated order history stored in Supabase.

## Glossary

- **ML Pricing Model**: A machine learning regression model trained on historical order data to predict order cost.
- **Price Prediction**: The model's estimated cost for a given set of order parameters.
- **Confidence Score**: A numeric value (0.0–1.0) indicating how reliable the model's prediction is for a given input.
- **Rule-Based Cost**: The existing deterministic cost computed by `costCalculator.js`.
- **Training Pipeline**: The process of extracting historical orders from Supabase, preprocessing features, training the model, and persisting it.
- **Feature Vector**: The numeric representation of an order's parameters used as input to the ML model (pages, copies, printType, binding).
- **Model Artifact**: The serialized, trained model file saved to disk or cloud storage.
- **Prediction Endpoint**: The backend API route that accepts order parameters and returns a price prediction.
- **Override**: A staff action that accepts the rule-based cost instead of the ML prediction for a specific order.
- **CampusPrint System**: The full stack application consisting of the React frontend and Node.js/Supabase backend.
- **Order History**: The set of completed (collected) orders stored in Supabase used to train the model.

---

## Requirements

### Requirement 1

**User Story:** As a student, I want to see an ML-predicted price estimate before submitting my order, so that I have a better sense of what my print job will cost.

#### Acceptance Criteria

1. WHEN a student fills in order parameters (pages, copies, printType, binding), THE CampusPrint System SHALL call the prediction endpoint and display the predicted price alongside the rule-based price.
2. WHEN the prediction endpoint receives a valid feature vector, THE CampusPrint System SHALL return a predicted price and a confidence score within 2 seconds.
3. IF the prediction endpoint is unavailable, THEN THE CampusPrint System SHALL display only the rule-based price and indicate that the ML estimate is currently unavailable.
4. WHEN the confidence score is below 0.5, THE CampusPrint System SHALL display a visual indicator that the estimate has low confidence.

---

### Requirement 2

**User Story:** As a staff member, I want to see the ML price prediction and confidence score on each order, so that I can make informed decisions when processing orders.

#### Acceptance Criteria

1. WHEN a staff member opens an order detail page, THE CampusPrint System SHALL display both the rule-based cost and the ML-predicted price with its confidence score.
2. WHEN a staff member chooses to override the ML prediction, THE CampusPrint System SHALL record the override action and apply the rule-based cost as the final order cost.
3. WHILE an order has status "received", THE CampusPrint System SHALL allow a staff member to accept or override the ML-predicted price.

---

### Requirement 3

**User Story:** As a system administrator, I want a training pipeline that builds the ML model from completed order history, so that the model improves over time as more orders accumulate.

#### Acceptance Criteria

1. WHEN the training pipeline is triggered, THE CampusPrint System SHALL extract all orders with status "collected" from Supabase as training data.
2. WHEN extracting training data, THE CampusPrint System SHALL encode categorical fields (printType, binding) into numeric feature vectors.
3. WHEN the training pipeline completes, THE CampusPrint System SHALL serialize the trained model artifact to a file using JSON so that it can be reloaded without retraining.
4. WHEN the serialized model artifact is loaded, THE CampusPrint System SHALL produce predictions identical to those produced immediately after training.
5. IF fewer than 10 completed orders exist, THEN THE CampusPrint System SHALL skip model training and return a "insufficient data" response from the prediction endpoint.

---

### Requirement 4

**User Story:** As a developer, I want the ML pricing model to accept and validate input feature vectors, so that invalid inputs are rejected before reaching the model.

#### Acceptance Criteria

1. WHEN the prediction endpoint receives a request with missing or non-numeric pages or copies fields, THE CampusPrint System SHALL return a 400 error with a descriptive message.
2. WHEN the prediction endpoint receives a printType value outside of ["bw", "color"], THE CampusPrint System SHALL return a 400 error.
3. WHEN the prediction endpoint receives a binding value outside of ["none", "staple", "spiral"], THE CampusPrint System SHALL return a 400 error.
4. WHEN all input fields are valid, THE CampusPrint System SHALL encode the feature vector and return a prediction without error.

---

### Requirement 5

**User Story:** As a developer, I want the ML model to be evaluated against the rule-based calculator, so that I can confirm the model is learning a reasonable pricing function.

#### Acceptance Criteria

1. WHEN the training pipeline completes, THE CampusPrint System SHALL compute the mean absolute error (MAE) between ML predictions and rule-based costs on the training set and log the result.
2. WHEN evaluated on the training set, THE CampusPrint System SHALL achieve a MAE below ₹10 after training on 50 or more orders.
3. WHEN the model artifact is serialized and then deserialized, THE CampusPrint System SHALL produce predictions that are numerically identical to the pre-serialization predictions for the same inputs.
