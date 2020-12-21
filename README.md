# Terratag Action

A GitHub Action for [Terratag](https://github.com/env0/terratag)

## Example Usage

```yaml
jobs:
  tag:
    steps:
      - name: Check out code into the Go module directory
        uses: actions/checkout@v2

      - uses: hashicorp/setup-terraform@v1
        with:
          terraform_version: 0.13.5
          # more setup-terraform configuration. See https://github.com/hashicorp/setup-terraform#usage
      - name: run terraform init
        run: |
            cd test/fixture/terraform_13_14/aws_autoscaling_group/input && terraform init

      - uses: env0/terratag-action@v2
        with:
          tags: |
            {
              "env0_environment_id":"40907eff-cf7c-419a-8694-e1c6bf1d1168","env0_project_id":"43fd4ff1-8d37-4d9d-ac97-295bd850bf94"
            }
          dir: test/fixture/terraform_13_14/aws_autoscaling_group/input 
```

## Documentation

*terraform* must be installed and "init" run before terratag can run
(see above usage example for a suggestion on how to do that in github actions).

Possible arguments that can be specified as `with` arguments:

* `tags` - *required* - a JSON object of tags to terratag
* `dir` - a directory to run in, if not workspace folder, optional
* `skipTerratagFiles: false` - specify this to run terratag over files with .terratag.tf extension as well
* `verbose: true` - specify this to turn on verbose logging
* `rename: false` - specify this to prevent renaming files to end with .terratag.tf suffix
* `terratagVersion: X.X.X` - specify a specific version of terratag to use - otherwise latest release is used by default
