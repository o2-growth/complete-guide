import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { ReactNode } from "react";

// vi.mock é hoisted — usa vi.hoisted pra criar mocks acessíveis no factory.
const hoisted = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockSignOut: vi.fn(),
  mockSignInWithPassword: vi.fn(),
  mockSignUp: vi.fn(),
}));

const {
  mockGetSession,
  mockOnAuthStateChange,
  mockSignOut,
} = hoisted;

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: hoisted.mockGetSession,
      onAuthStateChange: hoisted.mockOnAuthStateChange,
      signOut: hoisted.mockSignOut,
      signInWithPassword: hoisted.mockSignInWithPassword,
      signUp: hoisted.mockSignUp,
    },
  },
}));

import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  it("deve iniciar com loading=true e finalizar com user=null quando getSession retorna nulo", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it("deve popular user/session quando getSession retorna sessão válida", async () => {
    const fakeUser = { id: "u-1", email: "andrey@o2inc.com.br" };
    const fakeSession = { user: fakeUser, access_token: "tok" };
    mockGetSession.mockResolvedValue({ data: { session: fakeSession } });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.session).toEqual(fakeSession);
  });

  it("deve atualizar user quando o listener onAuthStateChange dispara SIGNED_IN", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    let capturedCallback:
      | ((event: string, session: unknown) => void)
      | undefined;
    mockOnAuthStateChange.mockImplementation((cb) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newUser = { id: "u-2", email: "x@y.z" };
    const newSession = { user: newUser, access_token: "k" };

    act(() => {
      capturedCallback?.("SIGNED_IN", newSession);
    });

    await waitFor(() => expect(result.current.user).toEqual(newUser));
    expect(result.current.session).toEqual(newSession);
  });

  it("signOut deve chamar supabase.auth.signOut", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSignOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signOut();
    });

    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  it("deve desinscrever a subscription no unmount", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const unsubscribe = vi.fn();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });

    const { unmount, result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
