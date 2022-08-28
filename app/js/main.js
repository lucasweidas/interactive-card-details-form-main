const textName = document.querySelector('[data-txt-name]');
const textNumber = document.querySelector('[data-txt-number]');
const textMonth = document.querySelector('[data-txt-month]');
const textYear = document.querySelector('[data-txt-year]');
const textCvc = document.querySelector('[data-txt-cvc]');
const form = document.querySelector('[data-form]');
const inputName = document.querySelector('[data-inp-name]');
const inputNumber = document.querySelector('[data-inp-number]');
const inputMonth = document.querySelector('[data-inp-month]');
const inputYear = document.querySelector('[data-inp-year]');
const inputCvc = document.querySelector('[data-inp-cvc]');
const success = document.querySelector('[data-success]');
const brand = {
  visa: {
    filter: /^4[0-9]{12}(?:[0-9]{3})?$/,
    src: 'dist/images/cc-logos/cc-visa.svg',
  },
  masterCard: {
    filter: /^(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}$/,
    src: 'dist/images/cc-logos/cc-mastercard.svg',
  },
  americanExpress: {
    filter: /^3[47][0-9]{13}$/,
    src: 'dist/images/cc-logos/cc-american-express.svg',
  },
  dinersClub: {
    filter: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
    src: 'dist/images/cc-logos/cc-diners-club.svg',
  },
  discover: {
    filter: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
    src: 'dist/images/cc-logos/cc-discover.svg',
  },
  jcb: {
    filter: /^(?:2131|1800|35\d{3})\d{11}$/,
    src: 'dist/images/cc-logos/cc-jcb.svg',
  },
  default: {
    filter: /^\d{16}$/,
    src: 'dist/images/cc-logos/cc-default.svg',
  },
  testValue(brandName, value) {
    return brand.getFilter(brandName).test(value);
  },
  getFilter(brandName) {
    return brand[brandName].filter;
  },
  getSrc(brandName) {
    return brand[brandName].src;
  },
};

form.addEventListener('input', filterInput);
form.addEventListener('submit', validateFormSubmit);
success.addEventListener('click', filterSuccessClick);

function filterInput(evt) {
  const { target, inputType } = evt;
  let textElement = null;
  let isValid = false;

  switch (target) {
    case inputName:
      isValid = validateInputValue(target, /^(?!\s)[a-zA-Z]*(?:[\s]?[a-zA-Z]*)*$/);
      textElement = textName;
      break;
    case inputNumber:
      const isDelete = inputType === 'deleteContentBackward' || inputType === 'deleteContentForward';
      isValid = validateInputValue(target, /^\d{0,16}$/);
      isValid && formatCreditCardNumber(target, isDelete);
      textElement = textNumber;
      break;
    case inputMonth:
      isValid = validateInputValue(target, /^(0[1-9]?|1[0-2]?)?$/);
      textElement = textMonth;
      break;
    case inputYear:
      isValid = validateInputValue(target, /^\d{0,2}$/);
      textElement = textYear;
      break;
    case inputCvc:
      isValid = validateInputValue(target, /^\d{0,3}$/);
      textElement = textCvc;
      break;
  }

  isValid && setCardText(textElement, target.value);
}

function filterSuccessClick({ target }) {
  if (!target.hasAttribute('data-btn-close')) return;

  verifyCreditCardBrand();
  setCardText();
  this.classList.add('hidden');
  form.classList.remove('hidden');
}

function validateInputValue(input, filter) {
  const value = input.hasAttribute('data-inp-number') ? removeSpaces(input.value) : input.value;
  let cursor = input.selectionStart;
  let isValid = false;

  if (filter.test(value)) {
    input.oldValue = input.value;
    isValid = true;
    hasInvalid(input) && removeErrorMessage(input);
  } else if (input.hasOwnProperty('oldValue')) {
    if (input.value === input.oldValue) return isValid;
    input.value = input.oldValue;
    cursor--;
    input.setSelectionRange(cursor, cursor);
  } else {
    input.value = '';
  }
  return isValid;
}

function resetInputsOldValue() {
  const formInputs = form.querySelectorAll('[data-form-input]');

  for (let index = 0; index < formInputs.length; index++) {
    formInputs[index].oldValue = '';
  }
}

function formatCreditCardNumber(input, isDelete) {
  const { value } = input;

  if (!value.length) return verifyCreditCardBrand();

  let cursor = input.selectionStart;
  const formattedValue = removeSpaces(value)
    .match(/\d{1,4}/g)
    .join(' ');
  input.value = formattedValue;
  input.oldValue = formattedValue;

  if (
    ((formattedValue.length > value.length && formattedValue.length <= cursor && formattedValue.charAt(cursor - 1) !== ' ') ||
      formattedValue.charAt(cursor - 1) === ' ') &&
    !isDelete
  ) {
    cursor++;
  }
  input.setSelectionRange(cursor, cursor);
  verifyCreditCardBrand(input);
}

function verifyCreditCardBrand(input) {
  const cardLogo = document.querySelector('[data-card-logo]');

  if (!input) return (cardLogo.src = brand.getSrc('default'));

  const { testValue, getFilter, getSrc } = brand;
  const value = removeSpaces(input.value);

  for (const brandName in brand) {
    if (brand[brandName].filter && testValue(brandName, value)) {
      cardLogo.src = getSrc(brandName);
      return getFilter(brandName);
    }
  }

  cardLogo.src = getSrc('default');
  return getFilter('default');
}

function removeSpaces(value) {
  return value.replace(/\s+/g, '');
}

function hasInvalid(element) {
  return element.classList.contains('invalid');
}

function getFirstDatasetProperty({ dataset }) {
  for (const key in dataset) {
    if (dataset.hasOwnProperty(key)) {
      return dataset[key];
    }
  }
}

function setCardText(textElement, value = '') {
  const textElements = textElement ? [textElement] : [...document.querySelectorAll('[data-card-text]')];

  textElements.forEach(textElement => {
    const placeholder = getFirstDatasetProperty(textElement);
    textElement.innerText = value.length ? value : placeholder;
  });
}

function validateFormSubmit(evt) {
  evt.preventDefault();
  const formInputs = form.querySelectorAll('[data-form-input]');

  formInputs.forEach(input => {
    if (!input.value.length) {
      return addErrorMessage(input, "Can't be blank");
    }
    if (!isInputFilled(input)) {
      return addErrorMessage(input, 'Wrong format');
    }
  });

  if (form.querySelector('[data-txt-error]')) return;

  form.classList.add('hidden');
  success.classList.remove('hidden');
  form.reset();
  resetInputsOldValue();
}

function addErrorMessage(element, message) {
  const wrapper = element.closest('[data-form-wrapper]');
  let error = wrapper.querySelector('[data-txt-error]');
  element.classList.add('invalid');

  if (error) return (error.innerText = message);

  error = document.createElement('span');
  error.classList.add('form__error');
  error.dataset.txtError = '';
  error.innerText = message;
  wrapper.appendChild(error);
}

function removeErrorMessage(element) {
  const wrapper = element.closest('[data-form-wrapper]');
  element.classList.remove('invalid');

  if (wrapper.dataset.formWrapper === 'date') {
    const inputs = [...wrapper.querySelectorAll('[data-form-input]')];
    const invalid = inputs.reduce((acc, cur) => {
      if (acc) return acc;
      acc = hasInvalid(cur);
      return acc;
    }, false);

    if (invalid) return;
  }
  wrapper.removeChild(wrapper.querySelector('[data-txt-error]'));
}

function isInputFilled(input) {
  switch (input) {
    case inputName:
      return validateInputValue(input, /^[a-zA-Z]+(?:[\s]+[a-zA-Z]+)*$/);
    case inputNumber:
      return validateInputValue(input, verifyCreditCardBrand(input));
    case inputMonth:
      return validateInputValue(input, /^(0[1-9]|1[0-2])$/);
    case inputYear:
      return validateInputValue(input, /^\d{2}$/);
    case inputCvc:
      return validateInputValue(input, /^\d{3}$/);
  }
}
