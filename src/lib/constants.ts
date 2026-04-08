export const CATEGORY_OPTIONS: Record<string, Record<string, string[]>> = {
  Expense: {
    Housing: ['Rent', 'Electricity', 'Internet', 'Mobile', 'Mobile Data'],
    Food: ['Grocery', 'Dine Out', 'Delivery', 'Drinks', 'Snack'],
    Transportation: [
      'Rideshare',
      'Gas',
      'Parking',
      'Public Transit',
      'Auto Insurance',
      'Lease',
      'Maintenance',
      'Moving',
      'Registration & Fees',
      'Tolls',
    ],
    Entertainment: ['Movie', 'Concert', 'Event', 'Musical'],
    Healthcare: ['Pharmacy', 'Dental Care', 'Eye Care', 'Knee Care', 'Physical Exam'],
    Pet: ['Daycare', 'Vet & Medical', 'Pet Insurance', 'Grooming', 'Supplies', 'Gifts & Souvenirs', 'Other'],
    Shopping: ['Clothes', 'Electronics', 'Home & Living', 'Skincare', 'Hobbies', 'Gifts & Souvenirs', 'Other'],
    'Self-care': ['Haircut', 'Spa', 'Work Out'],
    Financial: ['Fees', 'Tax Return', 'Interest'],
    Government: ['Immigration Fee', 'Other'],
    'Subscriptions & Services': ['Subscription'],
    Transfer: ['Deposit', 'Healthcare', 'Partner Support', 'Split Bill', 'Rewards', 'Other'],
    Travel: ['Flight', 'Hotel', 'Activities', 'Parking'],
  },
  Income: {
    Salary: ['Joy', 'Tan'],
    Financial: ['Interest', 'Tax Return'],
    Selling: ['Second Hand'],
  },
}

export const PAYMENT_METHODS = ['USD Account', 'RMB Account']
export const TYPES = ['Expense', 'Income']

export const CATEGORY_EMOJIS: Record<string, string> = {
  Housing: '🏠',
  Food: '🍜',
  Transportation: '🚗',
  Entertainment: '🎬',
  Healthcare: '🏥',
  Pet: '🐶',
  Shopping: '🛍️',
  'Self-care': '💆',
  Financial: '💰',
  Government: '🏛️',
  'Subscriptions & Services': '📱',
  Transfer: '🔄',
  Travel: '✈️',
  Salary: '💼',
  Selling: '🏷️',
  // fallback
  Income: '💚',
  Expense: '🔴',
}

export function getCategoryEmoji(category: string): string {
  return CATEGORY_EMOJIS[category] ?? '💳'
}
