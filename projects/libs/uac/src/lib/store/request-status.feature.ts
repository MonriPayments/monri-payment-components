import {signalStoreFeature, withComputed, withState} from "@ngrx/signals";
import {computed} from "@angular/core";

type RequestStatus =
  | 'idle'
  | 'pending'
  | 'fulfilled'
  | { error: string };

type RequestStatusState = { requestStatus: RequestStatus };


export function withRequestStatus() {
  return signalStoreFeature(
    withState<RequestStatusState>({ requestStatus: 'idle' }),
    withComputed(({ requestStatus }) => {
      const isPending = computed(() => requestStatus() === 'pending') as any
      const isFulfilled = computed(() => requestStatus() === 'fulfilled') as any
      const error = computed(() => {
        const status = requestStatus();
        return typeof status === 'object' && 'error' in status ? status.error : null;
      }) as any;

      return { isPending, isFulfilled, error };
    })
  );
}
export function setPending(): RequestStatusState {
  return {requestStatus: 'pending'};
}

export function setFulfilled(): RequestStatusState {
  return {requestStatus: 'fulfilled'};
}

export function setError(error: string): RequestStatusState {
  return {requestStatus: {error}};
}
