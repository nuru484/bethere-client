// src/components/users/table/columns.jsx
import { ArrowUpDown, Calendar, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { UserActionsDropdown } from "./UserActionsDropdown";

export const createUserColumns = () => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
            ? "indeterminate"
            : false
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "profilePicture",
    header: "Image",
    cell: ({ row }) => {
      const profilePicture = row.getValue("profilePicture");
      return (
        <div className="w-10 h-10 sm:w-12 sm:h-12 relative rounded-md overflow-hidden bg-muted flex items-center justify-center">
          {profilePicture ? (
            <img
              src={profilePicture}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "firstName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="p-0 h-auto font-semibold hover:bg-transparent text-left justify-start"
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const firstName = row.getValue("firstName");
      const lastName = row.original.lastName;
      const email = row.original.email;
      return (
        <div className="max-w-[200px] sm:max-w-[300px]">
          <div className="font-medium truncate text-sm sm:text-base">
            {firstName} {lastName}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-1">
            {email}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      const phone = row.getValue("phone");
      return <span className="text-xs sm:text-sm">{phone || "N/A"}</span>;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="p-0 h-auto font-semibold hover:bg-transparent"
      >
        <Calendar className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Created At</span>
        <ArrowUpDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return (
        <div className="text-xs sm:text-sm">
          <div className="sm:hidden">{format(date, "MMM dd")}</div>
          <div className="hidden sm:block">{format(date, "MMM dd, yyyy")}</div>
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    accessorKey: "createdAt",
    header: "Actions",
    cell: ({ row }) => <UserActionsDropdown user={row.original} />,
  },
];
