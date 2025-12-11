# CI/CD Setup for Tictalk Video

## Overview
This project uses GitHub Actions for Continuous Integration and Continuous Deployment (CI/CD) for Azure Functions.

## GitHub Actions Workflow
The CI/CD pipeline is defined in `.github/workflows/ci-cd.yml` and includes:
- Build and test on every push and pull request
- Automated deployment to Azure Functions on merge to main/master branch

## Required GitHub Secrets
You need to set up the following secrets in your GitHub repository settings:

### AZURE_CREDENTIALS
Create a service principal with the following Azure CLI command:

**Where to run this command:**
- **Azure Cloud Shell** (recommended) - Available in Azure Portal (Azure CLI already installed)
- Local terminal - Install Azure CLI first

**Install Azure CLI locally:**

**For Linux/Debian/Ubuntu:**
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

**For macOS:**
```bash
brew update && brew install azure-cli
```

**For Windows:**
```powershell
# Via PowerShell
$ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri https://aka.ms/installazurecliwindows -OutFile .\AzureCLI.msi; Start-Process msiexec.exe -Wait -ArgumentList '/I AzureCLI.msi /quiet'; rm .\AzureCLI.msi
```

**Verify installation:**
```bash
az --version
```

**Command:**
```bash
az ad sp create-for-rbac --name "GitHubActions" --role contributor --scopes /subscriptions/<your-subscription-id>/resourceGroups/<your-rg> --sdk-auth --output json
```

**Steps:**
1. Replace `<your-subscription-id>` and `<your-rg>` with your actual values
2. Run the command in Azure CLI
3. Copy the entire JSON output to the AZURE_CREDENTIALS GitHub secret

### AZURE_RESOURCE_GROUP
The name of your Azure resource group containing the Function App.

### AZURE_FUNCTIONAPP_NAME
The name of your Azure Function App.

## Initial Setup
1. Create an Azure Function App in Azure Portal or via Azure CLI
2. Set up the required secrets in GitHub
3. Ensure the Function App has proper permissions for the service principal

## Frontend Static Files
The static files (index.html, app.js, styles.css) are not automatically deployed. You may need to:

### Option 1: Azure Static Web Apps
Create an Azure Static Web App and add deployment to the workflow.

### Option 2: Azure Blob Storage
Serve the static files from Azure Blob Storage with a CDN:
- Enable static website hosting on a storage account
- Add a deployment job to upload files to blob storage

### Example Blob Storage Deployment
Add to `ci-cd.yml` in the deploy job:
```yaml
- name: Deploy static files to Blob Storage
  run: |
    az storage blob upload-batch \
      --account-name ${{ secrets.STORAGE_ACCOUNT_NAME }} \
      --source . \
      --destination "\$web" \
      --no-progress \
      --overwrite
```
You'll need to set `STORAGE_ACCOUNT_NAME` secret and ensure the service principal has contributor access to the storage account.

## Testing
Push changes to a feature branch to test the CI pipeline.
Merge to main/master to trigger deployment.
