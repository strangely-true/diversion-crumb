type StripeCheckoutPayload = {
    amount: number;
    email: string;
};

type StripeCheckoutResult = {
    sessionId: string;
    checkoutUrl: string;
};

export async function createMockStripeCheckout(
    payload: StripeCheckoutPayload,
): Promise<StripeCheckoutResult> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const safeAmount = Math.max(0, payload.amount);
    const safeEmail = payload.email.trim().toLowerCase();

    return {
        sessionId: `mock_sess_${Date.now()}`,
        checkoutUrl: `https://checkout.stripe.com/pay/mock-session?email=${encodeURIComponent(
            safeEmail,
        )}&amount=${safeAmount}`,
    };
}
