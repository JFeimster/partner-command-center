# Partner-Attributed Lead Router curl

Replace the host, API key, partner ID, and tracking token with controlled test values.

```bash
curl --request POST \
  --url https://partner-command-center-rho.vercel.app/api/lead-router \
  --header "Authorization: Bearer $PARTNER_COMMAND_API_KEY" \
  --header "Content-Type: application/json" \
  --header "Idempotency-Key: lead_20260710_partner_demo_01:create" \
  --data '{
    "schema_version": "1.0.0",
    "idempotency_key": "lead_20260710_partner_demo_01:create",
    "source_system": "embed_widget",
    "source_event_id": "widget_submission_demo_01",
    "submitted_at": "2026-07-10T18:00:00Z",
    "lead": {
      "lead_id": "lead_20260710_partner_demo_01",
      "applicant": {
        "first_name": "Demo",
        "last_name": "Owner",
        "business_name": "Demo Main Street Services LLC",
        "email": "demo.owner@example.com",
        "phone": "202-555-0142",
        "state": "DC"
      },
      "answers": {
        "business_persona": "local_service_business",
        "monthly_revenue": 42000,
        "time_in_business_months": 26,
        "credit_score": 674,
        "bank_status": "consistent",
        "business_structure": "entity_bank_ein_clean",
        "funding_purpose": "working_capital",
        "desired_funding_amount": 65000,
        "red_flags": ["none"]
      },
      "score_result": {
        "score": 82,
        "tier": {
          "id": "highly_fundable",
          "label": "Highly Fundable",
          "summary": "Stronger readiness signals; documentation and human review still apply."
        },
        "calculated_at": "2026-07-10T17:59:45Z",
        "engine_version": "scorecard-engine-1.0.0"
      },
      "lead_priority": "hot",
      "primary_funding_family": {
        "id": "working_capital",
        "label": "Working Capital Review",
        "summary": "Potential working-capital review path.",
        "confidence": "high"
      },
      "secondary_funding_families": [],
      "risks": [],
      "strengths": ["Meaningful monthly revenue signal"],
      "recommended_documents": [
        {
          "id": "business_bank_statements",
          "label": "Recent business bank statements",
          "detail": "Prepare complete recent statements for human review.",
          "required": true
        }
      ],
      "next_steps": [
        {
          "id": "human_funding_review",
          "label": "Queue a human funding-readiness review.",
          "owner": "operator",
          "status": "recommended"
        }
      ],
      "manual_review_recommended": false,
      "partner_id": "MS-P-REPLACE-WITH-ACTIVE-PARTNER",
      "tracking_link_id": "replace-with-referral-token",
      "campaign_id": "premium-partner-demo",
      "widget_id": "funding-readiness-scorecard-widget-v1",
      "source_url": "https://partner.example.com/funding-readiness",
      "source_asset": "partner_widget",
      "utm_source": "privateer_partner_network",
      "utm_medium": "embedded_widget",
      "utm_campaign": "premium-partner-demo",
      "utm_term": null,
      "utm_content": "scorecard",
      "consent": {
        "contact": true,
        "privacy": true,
        "captured_at": "2026-07-10T17:59:35Z",
        "method": "widget",
        "text_version": "funding-readiness-consent-v1"
      },
      "review_status": "scored",
      "created_at": "2026-07-10T17:59:45Z",
      "updated_at": "2026-07-10T17:59:45Z"
    }
  }'
```

Expected success properties:

```json
{
  "ok": true,
  "data": {
    "action": "submitPartnerAttributedLead",
    "result": "created",
    "lead_id": "lead_20260710_partner_demo_01",
    "attribution": {
      "status": "validated"
    },
    "persistence": {
      "funding_lead": "created",
      "partner_event": "created"
    }
  }
}
```
