export interface AlternativePaymentMethodInterface {
  startPayment(
    params: StartPaymentMethodParams
  ): Promise<StartPaymentMethodResponse> | null;
}

export type StartPaymentMethodParams = {
  type: string;
  data: Map<string, any>;
};

export type StartPaymentMethodResponse = {
  started: boolean;
  message?: string;
};
