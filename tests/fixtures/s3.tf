resource "aws_s3_bucket" "website_bucket" {
  bucket = "hello-env0-${random_string.random.result}"
  acl    = "public-read"

  force_destroy = true

  website {
    index_document = "index.html"
    error_document = "index.html"
  }
}
