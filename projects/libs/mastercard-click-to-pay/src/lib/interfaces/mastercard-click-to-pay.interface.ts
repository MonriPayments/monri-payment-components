export interface MastercardInitRequest {
  srcDpaId: string;
  coBrandNames?: string[];
  checkoutExperience?: string;
  recognitionToken?: string;
  cardBrands: string[];
  dpaTransactionOptions?: DpaTransactionOptions;
  dpaData: DpaData;
  services?: string[];
}

export interface MastercardInitResponse {
  availableCardBrands: string[];
  availableServices: string[];
}

export type DpaBillingPreference = 'FULL' | 'NONE' | 'POSTAL_COUNTRY';
export type OrderType = 'SPLIT_SHIPMENT' | 'PREFERRED_CARD';
export type ThreeDsPreference = 'NONE';
export type PayloadRequested = 'AUTHENTICATED' | 'NON_AUTHENTICATED';
export type DynamicDataType = 'CARD_APPLICATION_CRYPTOGRAM_SHORT_FORM' | 'NONE';
export type ApplicationType = 'WEB_BROWSER' | 'MOBILE_APP';
export type PaymentCardType = 'CREDIT' | 'DEBIT' | 'PREPAID' | 'COMBO' | 'FLEX';
export type DigitalCardStatus = 'ACTIVE';
export type ConsumerStatus = 'ACTIVE' | 'SUSPENDED' | 'LOCKED';
export type IdentityType = 'EMAIL_ADDRESS' | 'MOBILE_PHONE_NUMBER';
export type IdentityProvider = 'SRC';
export type VerificationType = 'CARDHOLDER';
export type VerificationEntity = '02' | '03';
export type VerificationEvent = '01' | '02' | '04';
export type VerificationMethod = '01' | '07' | '24';
export type VerificationResult = '01' | '02' | '03';
export type EciValue = '01' | '02' | '06';
export type PendingEvent =
  | 'PENDING_AVS'
  | 'PENDING_SCA'
  | 'PENDING_CONSUMER_IDV';

export interface DpaTransactionOptions {
  dpaAcceptedBillingCountries?: string[];
  dpaBillingPreference?: DpaBillingPreference;
  dpaLocale: string;
  consumerEmailAddressRequested?: boolean;
  consumerPhoneNumberRequested?: boolean;
  consumerNameRequested?: boolean;
  confirmPayment?: boolean;
  paymentOptions?: PaymentOption[];
  transactionAmount?: TransactionAmount;
  merchantCategoryCode?: string;
  merchantCountryCode?: string;
  merchantOrderId?: string;
  orderType?: OrderType;
  authenticationPreferences?: AuthenticationPreferences;
  threeDsPreference?: ThreeDsPreference;
  acquirerMerchantId?: string;
  acquirerBIN?: string;
}

export interface PaymentOption {
  dynamicDataType?: DynamicDataType;
}

export interface DpaData {
  dpaName: string;
  dpaPresentationName?: string;
  dpaAddress?: string;
  dpaEmailAddress?: Address;
  dpaPhoneNumber?: PhoneNumber;
  dpaLogoUri?: string;
  dpaSupportedEmailAddress?: Address;
  dpaSupportedPhoneNumber?: PhoneNumber;
  dpaUri?: string;
  dpaSupportUri?: string;
  applicationType?: ApplicationType;
}

export interface Address {
  addressId: string;
  name: string;
  line1: string;
  line2?: string;
  line3?: string;
  city: string;
  state?: string;
  zip?: string;
  countryCode?: string;
}

export interface MaskedAddress {
  name: string;
  line1: string;
  line2?: string;
  line3?: string;
  city: string;
  state?: string;
  countryCode: string;
  zip?: string;
  addressId: string;
  createTime?: string;
  lastUsedTime?: string;
}

export interface DigitalCardData {
  status: DigitalCardStatus;
  presentationName?: string;
  descriptorName: string;
  artUri: string;
  artHeight?: string;
  artWidth?: string;
  pendingEvents?: PendingEvent[];
  coBrandedName?: string;
  isCoBranded?: boolean;
}

export interface DCF {
  type: string;
  uri: string;
  logoUri: string;
  name: string;
}

export interface MaskedCard {
  srcDigitalCardId?: string;
  srcPaymentCardId?: string | null;
  panBin?: string;
  panLastFour: string;
  tokenLastFour?: string;
  panExpirationMonth?: string;
  panExpirationYear?: string;
  dateOfCardCreated: string;
  dateOfCardLastUsed?: string;
  maskedBillingAddress?: MaskedAddress;
  maskedShippingAddress?: MaskedAddress;
  digitalCardData: DigitalCardData;
  digitalCardFeatures?: unknown[];
  digitalCardRelatedData?: unknown;
  countryCode?: string;
  dcf?: DCF;
  paymentCardDescriptor?: string;
  paymentCardType?: PaymentCardType;
  tokenBinRange?: unknown;
  serviceId?: string;
}

export interface PhoneNumber {
  countryCode: string;
  phoneNumber: string;
}

export interface ConsumerIdentity {
  identityType: IdentityType;
  identityValue: string;
}

export interface AccountReference {
  consumerIdentity: ConsumerIdentity;
}

export type WindowRef = Window | WindowProxy | null;

export interface AuthenticateRequest {
  windowRef: WindowRef;
  requestRecognitionToken?: boolean;
  accountReference: AccountReference;
}

export interface AuthenticateResponse {
  recognitionToken?: string;
  cards?: MaskedCard[];
}

export interface BillingAddress {
  name?: string;
  line1?: string;
  line2?: string;
  line3?: string;
  city?: string;
  state?: string;
  zip?: string;
  countryCode?: string;
}

export interface EncryptCardRequest {
  primaryAccountNumber: string;
  panExpirationMonth: string;
  panExpirationYear: string;
  cardSecurityCode: string;
  cardholderFirstName?: string;
  cardholderLastName?: string;
  billingAddress?: BillingAddress;
}

export interface EncryptCardResponse {
  encryptedCard: string;
  cardBrand: string;
}

export interface Consumer {
  emailAddress?: string;
  mobileNumber?: PhoneNumber;
  firstName?: string;
  lastName?: string;
}

export interface AuthenticationPreferences {
  payloadRequested?: PayloadRequested;
}

export interface ComplianceSettings {
  [key: string]: unknown;
}

export interface CheckoutWithNewCardRequest {
  encryptedCard: string;
  cardBrand: string;
  consumer?: Consumer;
  windowRef: WindowRef;
  complianceSettings?: ComplianceSettings;
  dpaTransactionOptions?: DpaTransactionOptions;
  rememberMe?: boolean;
  recognitionTokenRequested?: boolean;
}

export interface CheckoutResponseHeaders {
  'x-src-cx-flow-id'?: string;
  'merchant-transaction-id'?: string;
}

export interface MaskedConsumerIdentity {
  identityProvider?: IdentityProvider;
  identityType: IdentityType;
  maskedIdentityValue: string;
}

export interface Consent {
  acceptedVersion?: string;
  latestVersion?: string;
  latestVersionUri?: string;
}

export interface ComplianceSettings {
  privacy?: Consent;
  tnc?: Consent;
}

export interface MaskedConsumer {
  srcConsumerId: string;
  maskedConsumerIdentity: MaskedConsumerIdentity;
  maskedEmailAddress?: string;
  maskedMobileNumber?: PhoneNumber;
  complianceSettings?: ComplianceSettings;
  countryCode?: string;
  languageCode?: string;
  status?: ConsumerStatus;
  maskedFirstName?: string;
  maskedLastName?: string;
  maskedFullName?: string;
  dateConsumerAdded: string;
  dateConsumerLastUsed?: string;
}

export interface VerificationData {
  verificationType: VerificationType;
  verificationEntity: VerificationEntity;
  verificationEvents?: VerificationEvent[];
  verificationMethod: VerificationMethod;
  verificationResults: VerificationResult;
  verificationTimestamp: string;
  additionalData?: string;
}

export interface AssuranceData {
  verificationData: VerificationData[];
  eci?: EciValue;
}

export interface TransactionAmount {
  transactionAmount: number;
  transactionCurrencyCode: string;
}

export interface PaymentTerms {
  content: string;
  installmentValue: string;
  numberOfSplitPayments: number;
  frequencyOfSplitPayments: string;
  learnMoreIcon: string;
  learnMoreContent: string;
  learnMoreUrl: string;
  productName: string;
  productLogoUrl: string;
}

export interface CheckoutResponseData {
  srcCorrelationId: string;
  srciTransactionId: string;
  maskedCard: MaskedCard;
  maskedConsumer?: MaskedConsumer;
  shippingAddressZip?: string;
  shippingCountryCode?: string;
  assuranceData?: AssuranceData;
}

export interface CheckoutWithCardRequest {
  srcDigitalCardId: string;
  windowRef: WindowRef;
  complianceSettings?: ComplianceSettings;
  dpaTransactionOptions?: DpaTransactionOptions;
  rememberMe?: boolean;
}

export interface CheckoutWithCardResponse {
  checkoutActionCode: string;
  checkoutResponse?: string;
  idToken?: string;
  network?: string;
  headers?: CheckoutResponseHeaders;
}

export interface CheckoutWithNewCardResponse {
  checkoutActionCode: string;
  checkoutResponse?: string;
  idToken?: string;
  recognitionToken?: string;
  network?: string;
  headers?: CheckoutResponseHeaders;
  checkoutResponseData?: CheckoutResponseData;
}

export interface SignOutRequest {
  recognitionToken?: string;
}

export interface SignOutResponse {
  recognized: boolean;
  cards: MaskedCard[];
}

export interface MastercardCheckoutService {
  init(data: MastercardInitRequest): Promise<MastercardInitResponse>;
  getCards(): Promise<MaskedCard[]>;
  authenticate(data: AuthenticateRequest): Promise<AuthenticateResponse>;
  encryptCard(params: EncryptCardRequest): Promise<EncryptCardResponse>;
  checkoutWithNewCard(
    data: CheckoutWithNewCardRequest
  ): Promise<CheckoutWithNewCardResponse>;
  checkoutWithCard(
    data: CheckoutWithCardRequest
  ): Promise<CheckoutWithCardResponse>;
  signOut(data: SignOutRequest): Promise<SignOutResponse>;
}

export interface MastercardCheckoutServices {
  new (): MastercardCheckoutService;
}
