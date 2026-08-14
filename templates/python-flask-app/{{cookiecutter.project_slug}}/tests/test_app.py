from src.app import app


def test_index_returns_200():
    client = app.test_client()
    response = client.get("/")
    assert response.status_code == 200


def test_health_returns_ok():
    client = app.test_client()
    response = client.get("/health")
    assert response.get_json() == {"status": "ok"}
