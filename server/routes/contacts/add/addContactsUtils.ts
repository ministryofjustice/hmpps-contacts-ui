import AddContactJourney = journeys.AddContactJourney

const captionForAddContactJourney = (journey: AddContactJourney): string => {
  if (journey.mode === 'NEW') {
    return 'Add a contact and link to a prisoner'
  }
  return 'Link a contact to a prisoner'
}

export default captionForAddContactJourney
