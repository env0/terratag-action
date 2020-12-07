# Terratag Action
A GitHub Action for [Terratag](https://github.com/env0/terratag)

### 👷‍ Work in progress

### Usage

```yaml
jobs:
  tag:
    steps:
          # Terratag requires Terraform
      - uses: hashicorp/setup-terraform@v1
        with:
          terraform_version: 0.12.25
          # more setup-terraform configuration. See https://github.com/hashicorp/setup-terraform#usage

      - uses: env0/terratag-action@v1
        with:
          tags: 
            environment_id: prod
            project_id: proj
            tenant_id: foo
          dir: infra
          skipTerratagFiles: true
          # more terratag configuration. See https://github.com/env0/terratag#usage
          
```
