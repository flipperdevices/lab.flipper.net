export function useNumbersOnly (evt) {
  const charCode = (evt.which) ? evt.which : evt.keyCode
  if ((charCode > 31 && (charCode < 48 || charCode > 57)) && charCode !== 46) {
    evt.preventDefault()
  } else {
    return true
  }
}
