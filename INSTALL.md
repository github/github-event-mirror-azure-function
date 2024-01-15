# Installing the Azure Function and GitHub App

To get this Azure Function working, you need to:

1. create an Azure Function app, and deploy this Azure Function to it
2. create a GitHub App, and install it on an org or repo
3. configure the Azure Function with the GitHub App's private key, webhook secret, and the GitHub App's ID

Once that is done, you can create an Actions workflow on any repository that the GitHub App is installed for, that listens for the `repository_dispatch` event, and does whatever you want it to do.

> ℹ️ when working with the Azure CLI, remember to use `az login` to log in to Azure, and `az logout` first if you are having problems

## Deploying the Azure Function

You need to create an Azure Function App, and deploy the Azure Function to it.

Before you deploy, set a `filter.yml` if you wish to filter out certain events. See [filtering events](README.md#filtering-events) for more details.

### Creating the Functions App

You can use the Azure Portal, the Azure CLI, or the VSCode Azure Functions extension to do this.

The Function uses the NodeJS runtime, and will work with NodeJS 18+.

#### Creating the Functions App with the Azure Portal

You need to create a new Function App, and then deploy the function to it.

In the [Azure Portal](https://portal.azure.com), click on the "Create a resource" button, and search for "Function App".

That should take you to the [Create Function App](https://portal.azure.com/#create/Microsoft.FunctionApp) page.

Fill in the details, and click on the "Review + create" button. Make sure you select the NodeJS runtime, of the latest stable version (18+).

#### Creating the Functions App with the Azure CLI

It needs your subscription ID, a resource group name, a storage account name, a location, and a function app name.

> **TODO**: test this

```bash
AZURE_SUBSCRIPTION_ID=<subscription id>
AZURE_RESOURCE_GROUP=<resource group name>
AZURE_LOCATION=<location>
AZURE_STORAGE_ACCOUNT=<storage account name>
AZURE_FUNCTION_APP_NAME=<function app name>

az account set --subscription "${AZURE_SUBSCRIPTION_ID}"
az group create --name "${AZURE_RESOURCE_GROUP}" --location "${AZURE_LOCATION}"
az storage account create --name "${AZURE_STORAGE_ACCOUNT}" --location "${AZURE_LOCATION}" --resource-group "${AZURE_RESOURCE_GROUP}" --sku Standard_LRS
az functionapp create --resource-group "${AZURE_RESOURCE_GROUP}" --consumption-plan-location "${AZURE_LOCATION}" --runtime node~18 --functions-version 3 --name "${AZURE_FUNCTION_APP_NAME}" --storage-account "${AZURE_STORAGE_ACCOUNT}"
```

#### Creating the Functions App with the VSCode Azure Functions extension

You need to install the [Azure Functions extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurefunctions) for VSCode.

Then, you can create a new Function App, and deploy the function to it, using the Workspace pane in the VSCode Azure Functions extension panel.

Left-click the Azure Functions button in the top right of the pane, and select "Create Function App in Azure...", then follow the prompts to create the Function App.

### Deploying the Function to the Function App

You then need to deploy the function to the Function App.

You can use the Azure Portal, the Azure CLI, or the VSCode Azure Functions extension to do this.

Some of these steps assume you have zipped up the code of this function into `github-webhook-mirror.zip`.

You can do that using:

```bash
zip -r github-webhook-mirror.zip . -x '.vscode/*' 'local.settings.json' '.git/*' '.github/*' '.gitignore' '.eslint*' '.funcignore' '*.md' 'CODEOWNERS' 'LICENSE' '*.ts' '*.js.map' 'jest.config.js' 'filter.yml.example' 'github-webhook-mirror.zip'
```

#### Deploying with the Azure Portal

In the [Azure Portal](https://portal.azure.com), click on the "Function Apps" button in the left-hand menu, and select the Function App you created.

That should take you to the Function App's page.

Click on the "Functions" button in the left-hand menu, and then click on the "Deploy" button in the top menu.

Select "Zip Deploy", and upload the `github-webhook-mirror.zip` file.

#### Deploying with the Azure CLI

```bash
AZURE_FUNCTION_APP_NAME=<function app name>

npm run build
func azure functionapp publish "${AZURE_FUNCTION_APP_NAME}" || echo "Failed to publish function app, try running 'az logout' then 'az login', then try again"
```

That may fail if it can't find the function app. If it does, you can try this alternative.

If you have already zipped up the code of this function into `github-webhook-mirror.zip`, you can use:

```bash
AZURE_SUBSCRIPTION_ID=<subscription id>
AZURE_RESOURCE_GROUP=<resource group name>
AZURE_FUNCTION_APP_NAME=<function app name>

az account set --subscription "${AZURE_SUBSCRIPTION_ID}"
az functionapp deployment source config-zip --resource-group "${AZURE_RESOURCE_GROUP}" --name "${AZURE_FUNCTION_APP_NAME}" --src github-webhook-mirror.zip
```

#### Deploying with the VSCode Azure Functions extension

There are a couple of ways to deploy the function to the Function App with the VSCode Azure Functions extension.

1. Use the Workspace pane in the VSCode Azure Functions extension panel. Left-click the Azure Functions button in the top right of the pane, and select "Deploy to Function App...", then follow the prompts to deploy the function.
   - or
2. Find the Function App in the Resources pane (under the correct Subscription). Right-click it, and select "Deploy to Function App..." from the context menu.

### Finding the Function's URL

You need to find the URL of the Function.

You can use the Azure Portal, the Azure CLI, or the VSCode Azure Functions extension to do this.

If you can't find the Function under the Functions App, you may need to click on the "Refresh" button in the top menu. If that doesn't work, there may be an error in the Function's code or settings. Check that you can debug the Function locally, to see if there are any mistakes in the configuration, especially the `PRIVATE_KEY` setting.

#### Finding the Functions App's URL with the Azure Portal

In the [Azure Portal](https://portal.azure.com), click on the "Function Apps" button in the left-hand menu, and select the Function App you created.

That should take you to the Function App's page. You should see your Function listed in the table. Left-click on the Function's name, and on the Function's page, left-click on the "Get function URL" button in the top menu. Copy the URL.

#### Finding the Functions App's URL with the Azure CLI

```bash
AZURE_SUBSCRIPTION_ID=<subscription id>
AZURE_RESOURCE_GROUP=<resource group name>
AZURE_FUNCTION_APP_NAME=<function app name>

az account set --subscription "${AZURE_SUBSCRIPTION_ID}"
az functionapp show --resource-group "${AZURE_RESOURCE_GROUP}" --name "${AZURE_FUNCTION_APP_NAME}" --query "defaultHostName" --output tsv
```

Add `/api/webhook-mirror` to the end of the URL, to get the full URL to your Function.

#### Finding the Functions App's URL with the VSCode Azure Functions extension

You can find the URL of the Function App in the Resources pane (under the correct Subscription).

Open up the Function App, and expand the Functions node. Right-click on the Function, and select "Copy Function Url" from the context menu.

## Creating a GitHub app

You need to create a GitHub app, and install it on a repo. You can use the UI to do this.

Using the GitHub API to create this GitHub App is not yet implemented.

### Use the GitHub UI to create a new GitHub App

1. Got to the Organization you want to create the app in
2. Click on the "Settings" button in the top menu bar
3. Click on the "Developer settings" button in the left-hand side panel
4. Click on the "GitHub Apps" link
5. Click on the "New GitHub App" button at the top right of the page

That should take you to the `https://github.com/organizations/<org>/settings/apps/new` page for your organization, which will replace `<org>`.

Fill in the details, and click on the "Create GitHub App" button.

You will need a name, a description, a homepage URL (which can just be `https://github.com/advanced-security/`, if you like), and a webhook URL. You also need a make a secret and to generate a private key.

- the webhook URL is the URL of the Function you created earlier
- use a secure secret for the webhook secret, since this authenticates that this GitHub App is making requests to your Functions App
- give the GitHub App read and write access to Actions under the repository permissions
- leave the option selected to "Enable SSL verification"
- select the events you want to receive, by giving the app the relevant additional permissions, and then selecting which events should be sent to the webhook
  - ⚠️ carefully think about the security implications of giving _anyone with write access_ to your repository access to these events before you choose the events
- click on the "Generate a private key" button. This will automatically download the private key as a `.pem` file.
  - ⚠️ save the private key somewhere safe - _this is the only time you get to download it_, and you will need it later

[The full GitHub docs](https://docs.github.com/en/enterprise-cloud@latest/apps/creating-github-apps/registering-a-github-app/registering-a-github-app) can help you if you get stuck.

### Use the GitHub API to create a new GitHub App

> **TODO**

This is possible [using a manifest](https://docs.github.com/en/enterprise-cloud@latest/apps/sharing-github-apps/registering-a-github-app-from-a-manifest), but has not yet been implemented here.

## Installing the GitHub App

You need to install the GitHub App on an organization or repository.

### Use the GitHub UI to install the GitHub App

- navigate to the GitHub App you created earlier, and click on the "Install App" button
- choose whether to install it for selected repositories, or for the whole organization

### Use the GitHub API to install the GitHub App

> **TODO**

This has not been implemented yet.

This is left until the creation of the app using a manifest has been implemented.

### Configuring the Functions App

Set the following environment variables in the Functions App:

```bash
APP_ID=...
PRIVATE_KEY=...
WEBHOOK_SECRET=...
```

where `APP_ID` is the ID of the GitHub App you created earlier, `PRIVATE_KEY` is the contents of the `.pem` file you downloaded earlier, and `WEBHOOK_SECRET` is the webhook secret you defined when you configured the GitHub App.

#### Configuring the Functions App with the Azure Portal

These environment variables can be configured in the Azure Portal under the "Configuration" section of the Function App, as "Application settings".

#### Configuring the Functions App with the Azure Functions extension for VSCode

You can also configure the environment variables in the Azure Functions extension in VSCode, by right-clicking on the Function App in the Resources pane, and selecting "Configure Application Settings" from the context menu.

They can be synced to the local `local.settings.json` file by right-clicking on the Function App in the Resources pane, and selecting "Download remote settings" from the context menu.

You can also set them directly in the `local.settings.json` and sync them to the remote Function App by right-clicking on the Function App in the Resources pane, and selecting "Upload local settings" from the context menu.

#### Configuring the Functions App with the Azure CLI

> **TODO**: test this

```bash
AZURE_SUBSCRIPTION_ID=<subscription id>
AZURE_RESOURCE_GROUP=<resource group name>
AZURE_FUNCTION_APP_NAME=<function app name>

az account set --subscription "${AZURE_SUBSCRIPTION_ID}"
az functionapp config appsettings set --name "${AZURE_FUNCTION_APP_NAME}" --resource-group "${AZURE_RESOURCE_GROUP}" --settings @local.settings.json
```
