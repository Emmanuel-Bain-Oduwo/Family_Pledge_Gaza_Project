from typing import Any

from pydantic import BaseModel, Field


class AiChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1, max_length=4000)


class AiChatRequest(BaseModel):
    message: str = Field(min_length=2, max_length=4000)
    history: list[AiChatMessage] = Field(default_factory=list, max_length=12)


class AiContextBlock(BaseModel):
    name: str
    description: str
    data: dict[str, Any] | list[dict[str, Any]]


class AiChatOut(BaseModel):
    answer: str
    context_used: list[AiContextBlock] = Field(default_factory=list)
    scope: str = "family_pledge_admin"
    actions_executed: list[str] = Field(default_factory=list)
