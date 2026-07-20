// src/pages/dashboard/UsersManagePage.jsx
//
// Attendant management (principal split): /users on the server now serves
// attendants only, so there is no role column, filter or stat here. Admin
// staff live on the separate Admins page.
import { Link } from "react-router-dom";
import { UsersDataTable } from "@/components/users/table/UsersDataTable";
import { DataTableSkeleton } from "@/components/ui/DataTableSkeleton";
import { useGetAllUsers } from "@/hooks/useUsers";
import { usePaginatedListState } from "@/hooks/usePaginatedListState";
import AsyncBoundary from "@/components/ui/AsyncBoundary";
import { Button } from "@/components/ui/button";

// Filter fields this page owns (stable identity for the URL-state hook).
const FILTER_KEYS = ["search"];

const Userspage = () => {
  // Page, page size and filters live in the URL so refresh/back/share keep
  // the same view.
  const { page, pageSize, filters, setPage, setPageSize, setFilters } =
    usePaginatedListState({ filterKeys: FILTER_KEYS });

  // Build query parameters
  const queryParams = {
    page,
    limit: pageSize,
    ...Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined)
    ),
  };

  const {
    data: usersData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAllUsers(queryParams);

  const users = usersData?.data;
  const totalUsers = usersData?.meta?.total || 0;

  // setPageSize and setFilters already reset the page to 1.
  const handlePageChange = setPage;
  const handlePageSizeChange = setPageSize;
  const handleFiltersChange = setFilters;

  const handleRefresh = () => refetch();

  return (
    <AsyncBoundary
      isLoading={isLoading && !users}
      isError={isError}
      error={error}
      onRetry={refetch}
      skeleton={<DataTableSkeleton />}
    >
      <div className="min-h-screen">
      <div className="space-y-4 sm:space-y-6">
        {/* Header: mono eyebrow + display title */}
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
              People
            </p>
            <h1 className="mt-1 break-words font-display text-2xl font-normal leading-tight tracking-[-0.02em] text-foreground sm:text-3xl">
              Attendants
            </h1>
            <p className="mt-1 text-sm leading-snug text-muted-foreground sm:mt-1.5 md:text-base">
              Enrolled people who can check in
            </p>
          </div>

          <Button asChild size="sm" className="flex-shrink-0">
            <Link to="/dashboard/users/create">Add attendant</Link>
          </Button>
        </div>

        {/* Users Data Table */}
        <div className="overflow-hidden">
          <UsersDataTable
            data={users || []}
            loading={isLoading}
            fetching={isFetching && !isLoading}
            totalCount={totalUsers}
            page={page}
            pageSize={pageSize}
            filters={filters}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onFiltersChange={handleFiltersChange}
            onRefresh={handleRefresh}
          />
        </div>
      </div>
      </div>
    </AsyncBoundary>
  );
};

export default Userspage;
