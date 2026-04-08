from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "dataset.csv"
MODEL_PATH = BASE_DIR / "model.pkl"

FEATURE_COLUMNS = ["aqi", "pm25", "pm10", "age_group", "sensitivity"]
TARGET_COLUMN = "risk"


def load_dataset() -> pd.DataFrame:
    dataset = pd.read_csv(DATASET_PATH)
    dataset = dataset.dropna(subset=FEATURE_COLUMNS + [TARGET_COLUMN])
    dataset["aqi"] = pd.to_numeric(dataset["aqi"], errors="coerce")
    dataset["pm25"] = pd.to_numeric(dataset["pm25"], errors="coerce")
    dataset["pm10"] = pd.to_numeric(dataset["pm10"], errors="coerce")
    dataset["risk"] = pd.to_numeric(dataset["risk"], errors="coerce").astype("Int64")
    dataset = dataset.dropna(subset=FEATURE_COLUMNS + [TARGET_COLUMN])
    dataset["risk"] = dataset["risk"].astype(int)
    return dataset


def main() -> None:
    dataset = load_dataset()
    if len(dataset) < 50:
        raise RuntimeError(f"Dataset is too small for training: {len(dataset)} rows")

    x = dataset[FEATURE_COLUMNS]
    y = dataset[TARGET_COLUMN]

    stratify = y if y.value_counts().min() >= 2 else None
    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=42,
        stratify=stratify,
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("categorical", OneHotEncoder(handle_unknown="ignore"), ["age_group", "sensitivity"]),
        ],
        remainder="passthrough",
    )

    model = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", RandomForestClassifier(n_estimators=200, random_state=42, class_weight="balanced")),
        ]
    )

    model.fit(x_train, y_train)
    predictions = model.predict(x_test)

    print(f"accuracy={accuracy_score(y_test, predictions):.4f}")
    print(classification_report(y_test, predictions, zero_division=0))

    joblib.dump(model, MODEL_PATH)
    print(f"saved_model={MODEL_PATH}")


if __name__ == "__main__":
    main()
