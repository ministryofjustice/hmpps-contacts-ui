#!/bin/bash

# Use this script to find what values are currently set for feature flag environment variables

# Usage: ./recreate-pod.sh [1|2|3]
# 1 = dev, 2 = preprod, 3 = prod

  read -p "Select environment (1=dev, 2=preprod, 3=prod): " ENV_CHOICE
  if [[ "$ENV_CHOICE" == "1" ]]; then
    CONTACTS_UI_NAMESPACE="hmpps-contacts-dev"
  elif [[ "$ENV_CHOICE" == "2" ]]; then
    CONTACTS_UI_NAMESPACE="hmpps-contacts-preprod"
  elif [[ "$ENV_CHOICE" == "3" ]]; then
    CONTACTS_UI_NAMESPACE="hmpps-contacts-prod"
  else
    echo "Invalid selection. Usage: 1=dev, 2=preprod, 3=prod"
    exit 1
  fi

FEATURE_RELATIONSHIP_APPROVED_BY_ENABLED=$(kubectl -n "$CONTACTS_UI_NAMESPACE" get secret feature-toggles -o jsonpath='{.data.FEATURE_RELATIONSHIP_APPROVED_BY_ENABLED}' | base64 -d)
FEATURE_NOMIS_SCREENS_OFF_PRISONS=$(kubectl -n "$CONTACTS_UI_NAMESPACE" get secret feature-toggles -o jsonpath='{.data.FEATURE_NOMIS_SCREENS_OFF_PRISONS}' | base64 -d)

echo ENVIRONMENT="$CONTACTS_UI_NAMESPACE"
echo "-----------------------"
echo Contacts ui - FEATURE_RELATIONSHIP_APPROVED_BY_ENABLED="$FEATURE_RELATIONSHIP_APPROVED_BY_ENABLED"
echo Contacts ui - FEATURE_NOMIS_SCREENS_OFF_PRISONS="$FEATURE_NOMIS_SCREENS_OFF_PRISONS"