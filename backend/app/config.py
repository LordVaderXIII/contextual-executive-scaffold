from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = (
        "mysql+pymysql://ces_user:ces_test_password@db:3306/ces"
        "?charset=utf8mb4"
    )
    seed_on_start: bool = True
    ces_api_key: str = ""
    cors_origins: str = "http://localhost:3000,http://localhost:8080"

    ha_url: str = ""
    ha_token: str = ""
    ha_webhook_secret: str = ""
    ha_person_entity: str = "person.you"
    ha_mock_zones: str = "home:home-evening,work:work-desk,not_home:errands"

    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o-mini"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()