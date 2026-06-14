# SES Domain Identity
resource "aws_ses_domain_identity" "main" {
  domain = var.domain_name
}

# SES Domain DKIM
resource "aws_ses_domain_dkim" "main" {
  domain = aws_ses_domain_identity.main.domain
}

# SES Domain Mail From
resource "aws_ses_domain_mail_from" "main" {
  domain           = aws_ses_domain_identity.main.domain
  mail_from_domain = "mail.${var.domain_name}"
}

# Route53 records for SES verification (if you manage DNS with Route53)
# Uncomment if using Route53 for DNS management
# data "aws_route53_zone" "main" {
#   name         = var.domain_name
#   private_zone = false
# }

# resource "aws_route53_record" "ses_verification" {
#   zone_id = data.aws_route53_zone.main.zone_id
#   name    = "_amazonses.${var.domain_name}"
#   type    = "TXT"
#   ttl     = 600
#   records = [aws_ses_domain_identity.main.verification_token]
# }

# resource "aws_route53_record" "ses_dkim" {
#   count   = 3
#   zone_id = data.aws_route53_zone.main.zone_id
#   name    = "${aws_ses_domain_dkim.main.dkim_tokens[count.index]}._domainkey.${var.domain_name}"
#   type    = "CNAME"
#   ttl     = 600
#   records = ["${aws_ses_domain_dkim.main.dkim_tokens[count.index]}.dkim.amazonses.com"]
# }

# resource "aws_route53_record" "ses_mail_from_mx" {
#   zone_id = data.aws_route53_zone.main.zone_id
#   name    = aws_ses_domain_mail_from.main.mail_from_domain
#   type    = "MX"
#   ttl     = 600
#   records = ["10 feedback-smtp.${data.aws_region.current.name}.amazonses.com"]
# }

# resource "aws_route53_record" "ses_mail_from_spf" {
#   zone_id = data.aws_route53_zone.main.zone_id
#   name    = aws_ses_domain_mail_from.main.mail_from_domain
#   type    = "TXT"
#   ttl     = 600
#   records = ["v=spf1 include:amazonses.com ~all"]
# }

data "aws_region" "current" {}
