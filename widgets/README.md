# Moonshine Partner Command Center — Widget Layer

Batch 11 adds a static embeddable funding-readiness widget.

## Files

```text
/widgets/
  widget-config.js
  funding-widget.html
  funding-widget.css
  funding-widget.js
  embed.js
  README.md
```

## What this widget does

The widget provides a small funding-readiness inquiry form that can be embedded on partner websites, landing pages, resource pages, or demo pages.

It can collect basic demo fields:

- Business name
- Contact name
- Email
- Phone
- Monthly revenue estimate
- Funding need estimate
- Timeline
- Use of funds
- Consent acknowledgment

## What this widget does not do

This static widget does **not**:

- Submit to a live API
- Create a CRM lead
- Create a funding application
- Trigger lender review
- Validate underwriting eligibility
- Create a partner payout or commission event
- Store data securely
- Replace a production privacy, consent, or compliance workflow

Demo inquiries are stored in the browser using `localStorage`.

## Direct preview

Open:

```text
/widgets/funding-widget.html
```

Optional query parameters:

```text
/widgets/funding-widget.html?partner_id=MS-FB-1024&source=partner-site&theme=dark
```

Supported parameters:

| Parameter | Purpose |
| --- | --- |
| `partner_id` | Partner attribution ID |
| `source` | Source label |
| `theme` | `dark` or `light` |
| `title` | Widget headline |
| `subtitle` | Widget intro copy |
| `brand` | Brand label |
| `cta` | Submit button label |

## Embed snippet

Use this on a static page:

```html
<script
  src="https://YOUR-DOMAIN.com/widgets/embed.js"
  data-moonshine-partner-id="MS-FB-1024"
  data-moonshine-source="partner-site"
  data-moonshine-theme="dark">
</script>
```

The script injects an iframe pointed at:

```text
/widgets/funding-widget.html
```

## Mount into a specific container

```html
<div id="funding-widget"></div>

<script
  src="https://YOUR-DOMAIN.com/widgets/embed.js"
  data-moonshine-target="#funding-widget"
  data-moonshine-partner-id="MS-FB-1024"
  data-moonshine-source="partner-landing-page"
  data-moonshine-theme="dark">
</script>
```

## Manual mount

```html
<div id="funding-widget"></div>

<script src="https://YOUR-DOMAIN.com/widgets/embed.js" data-moonshine-manual="true"></script>
<script>
  window.MoonshineFundingWidget.mount({
    getAttribute: function (name) {
      var values = {
        "data-moonshine-target": "#funding-widget",
        "data-moonshine-partner-id": "MS-FB-1024",
        "data-moonshine-source": "manual-mount",
        "data-moonshine-theme": "dark"
      };

      return values[name] || "";
    },
    src: "https://YOUR-DOMAIN.com/widgets/embed.js"
  });
</script>
```

## Widget events

The iframe emits `postMessage` events to the parent page:

| Event | Meaning |
| --- | --- |
| `moonshine.widget.ready` | Widget loaded |
| `moonshine.widget.submitted` | Demo inquiry saved locally |
| `moonshine.widget.error` | Required field or consent issue |
| `moonshine.widget.resized` | Widget height changed |

Example listener:

```html
<script>
  document.addEventListener("moonshine.widget.submitted", function (event) {
    console.log("Widget submitted:", event.detail.message.payload);
  });
</script>
```

## Production upgrade path

To make this production-ready, add:

1. A real lead submission API.
2. Server-side validation.
3. Bot protection.
4. Consent capture.
5. Secure storage.
6. CRM routing.
7. Partner ID validation.
8. Audit logs.
9. Privacy policy alignment.
10. Compliance review for all copy and fields.

## Compliance note

Funding options may vary. Submission does not guarantee approval, funding, rates, terms, timelines, lender review, commissions, income, or any specific business outcome.
