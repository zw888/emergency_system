
export const updateCommationInformation = (commationInfo) => {
  return {
    type: 'UPDATE_COMMATION_INFORMATION',
    commationInfo
  }
}
export const resetCommationInformation = () => {
  return {
    type: 'RESEET_COMMATION_INFORMATION'
  }
}


export const updateTrainInformation = (trainInfo) => {
  return {
    type: 'UPDATE_TRAIN_INFORMATION',
    trainInfo
  }
}
export const resetTrainInformation = () => {
  return {
    type: 'RESEET_TRAIN_INFORMATION'
  }
}
