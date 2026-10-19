from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.core.database import get_db
from app.api.endpoints.ia import processar_requisicao_mensagem
from app.api.schemas import RequisicaoMensagemIn

router = APIRouter()


@router.get("/webhooks/n8n/health")
def n8n_webhook_health():
    """Healthcheck para integração do N8N e WhatsApp Gateway."""
    return {
        "status": "online",
        "service": "N8N WhatsApp Inbound Webhook",
        "compatibilidade": ["Evolution API", "Z-API", "N8N Webhook Node"],
    }


@router.post("/webhooks/n8n/requisicao")
async def n8n_requisicao_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Endpoint de recepção direta do N8N quando o pedreiro ou mestre de obras manda
    mensagem ou áudio no grupo oficial de WhatsApp da obra.
    """
    body = await request.json()

    # Suporta formatos comuns de webhook (Evolution API, Z-API ou direto do N8N)
    remetente = body.get("remetente") or body.get("sender") or body.get("pushName") or "Wagner (Mestre de Obras)"
    texto = body.get("texto") or body.get("message") or body.get("conversation") or body.get("transcricao") or ""
    audio_url = body.get("audio_url") or body.get("mediaUrl")

    if not texto and not audio_url:
        return {
            "status": "ignorado",
            "motivo": "Mensagem vazia ou sem texto reconhecido",
        }

    payload = RequisicaoMensagemIn(
        remetente_nome=remetente,
        canal="WhatsApp / N8N",
        texto_mensagem=texto or "Áudio recebido do canteiro",
        audio_url=audio_url,
    )

    resposta = processar_requisicao_mensagem(payload, db)

    return {
        "status": "processado",
        "resposta_whatsapp": resposta.mensagem_whatsapp_formatada,
        "total_itens": resposta.total_itens,
        "requisicao_id": resposta.requisicao_id,
        "itens": [it.dict() for it in resposta.itens],
    }
