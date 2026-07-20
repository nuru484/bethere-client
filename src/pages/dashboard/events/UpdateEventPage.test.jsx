// src/pages/dashboard/events/UpdateEventPage.test.jsx
//
// Asserts the submit payload mapping around EventForm: dates become ISO
// strings, recurrence fields only ride along when set, and the cover image
// keeps its tri-state contract - undefined (untouched), "" (remove the
// stored image), File (replace).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import UpdateEventPage from "@/pages/dashboard/events/UpdateEventPage";

const updateEventMutate = vi.fn();

const eventResponse = {
  data: {
    id: 7,
    title: "Morning Standup",
    description: "Daily sync",
    startDate: "2026-07-01T00:00:00.000Z",
    endDate: "2026-07-31T00:00:00.000Z",
    startTime: "06:00",
    endTime: "09:30",
    isRecurring: false,
    recurrenceInterval: null,
    durationDays: null,
    type: "Meeting",
    coverImage: "https://cdn.test/cover.jpg",
    location: { name: "Hall A", city: "Accra", country: "Ghana" },
  },
};

vi.mock("@/hooks/useEvent", () => ({
  useGetEvent: () => ({
    data: eventResponse,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useUpdateEvent: () => ({ mutate: updateEventMutate, isPending: false }),
}));

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

// Compression needs a real canvas; pass the picked file straight through.
vi.mock("@/lib/compress-image", () => ({
  compressImage: vi.fn(async (file) => file),
}));

// In the app the dashboard Layout's SidebarProvider supplies the
// TooltipProvider the form's info tooltips need.
const renderPage = () =>
  render(
    <TooltipProvider>
      <MemoryRouter initialEntries={["/dashboard/events/7/edit"]}>
        <Routes>
          <Route
            path="/dashboard/events/:eventId/edit"
            element={<UpdateEventPage />}
          />
          <Route
            path="/dashboard/events/:eventId"
            element={<div>details</div>}
          />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>
  );

const submit = async (user) => {
  await user.click(screen.getByRole("button", { name: /update event/i }));
  await waitFor(() => expect(updateEventMutate).toHaveBeenCalledTimes(1));
  return updateEventMutate.mock.calls[0][0];
};

// jsdom lacks ResizeObserver, which the radix checkbox measures with.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("UpdateEventPage submit payload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.ResizeObserver = globalThis.ResizeObserver || ResizeObserverStub;
    // jsdom has no object URLs; the cover preview effect needs them.
    URL.createObjectURL = vi.fn(() => "blob:mock-cover");
    URL.revokeObjectURL = vi.fn();
  });

  it("maps the untouched form to the API payload with coverImage undefined", async () => {
    const user = userEvent.setup();
    renderPage();

    const { eventId, data } = await submit(user);

    expect(eventId).toBe("7");
    expect(data).toMatchObject({
      title: "Morning Standup",
      description: "Daily sync",
      startDate: new Date("2026-07-01").toISOString(),
      endDate: new Date("2026-07-31").toISOString(),
      startTime: "06:00",
      endTime: "09:30",
      isRecurring: false,
      type: "Meeting",
      location: { name: "Hall A", city: "Accra", country: "Ghana" },
    });
    // Tri-state: untouched cover image means "leave it alone".
    expect(data.coverImage).toBeUndefined();
    // Non-recurring event without values: recurrence fields stay out.
    expect(data.recurrenceInterval).toBeUndefined();
    expect(data.durationDays).toBeUndefined();
  });

  it('sends coverImage: "" after removing the stored image', async () => {
    const user = userEvent.setup();
    renderPage();

    // The stored cover renders with a Remove action; removing an existing
    // image marks it for deletion.
    await user.click(screen.getByRole("button", { name: /remove/i }));

    const { data } = await submit(user);
    expect(data.coverImage).toBe("");
  });

  it("sends the picked File when the cover image is replaced", async () => {
    const user = userEvent.setup();
    renderPage();

    const file = new File(["img-bytes"], "new-cover.png", {
      type: "image/png",
    });
    const input = screen.getByLabelText(/cover image/i);
    fireEvent.change(input, { target: { files: [file] } });

    const { data } = await submit(user);
    expect(data.coverImage).toBeInstanceOf(File);
    expect(data.coverImage.name).toBe("new-cover.png");
  });
});
