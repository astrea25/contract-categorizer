import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Contract, ContractType, ContractStatus, contractTypeLabels } from './data';
import { format } from 'date-fns';
import { groupBy } from 'lodash';

// Map status codes to readable labels
const statusLabels: Record<ContractStatus, string> = {
  requested: "Requested",
  draft: "Draft",
  legal_review: "Legal Review",
  management_review: "Management Review",
  wwf_signing: "WWF Signing",
  counterparty_signing: "Counterparty Signing",
  implementation: "Implementation",
  amendment: "Amendment",
  contract_end: "Contract End",
  approval: "Approval",
  finished: "Finished",
  legal_send_back: "Legal Send Back",
  management_send_back: "Management Send Back",
  legal_declined: "Legal Declined",
  management_declined: "Management Declined"
};

/**
 * Formats a date string to a readable format
 * @param dateString ISO date string
 * @returns Formatted date string or empty string if invalid
 */
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    return '';
  }
};

/**
 * Formats a currency value
 * @param value Number to format
 * @returns Formatted currency string or empty string if null
 */
const formatCurrency = (value: number | null): string => {
  if (value === null) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(value);
};

/**
 * Gets the supporting documents for a contract
 * @param contract Contract to get supporting documents for
 * @returns Array of supporting document names and their checked status
 */
const getSupportingDocumentColumns = (contract: Contract): Record<string, string> => {
  const result: Record<string, string> = {};

  if (contract.supportingDocuments && Array.isArray(contract.supportingDocuments)) {
    contract.supportingDocuments.forEach(doc => {
      const columnName = `Doc: ${doc.name}`;
      result[columnName] = doc.checked ? '✓' : '✗';
    });
  }

  return result;
};

/**
 * Gets the type-specific fields for a contract based on its type
 * @param contract Contract to get type-specific fields for
 * @returns Object with type-specific field names and values
 */
const getTypeSpecificColumns = (contract: Contract): Record<string, string> => {
  const result: Record<string, string> = {};

  if (!contract.typeSpecificFields) {
    return result;
  }

  const fields = contract.typeSpecificFields;

  switch (contract.type) {
    case 'consultancy':
      if ('consultantName' in fields) result['Consultant Name'] = fields.consultantName || '';
      if ('positionTitle' in fields) result['Position Title'] = fields.positionTitle || '';
      if ('grossProfessionalFee' in fields) result['Gross Professional Fee'] = formatCurrency(fields.grossProfessionalFee || 0);
      if ('paymentSchedules' in fields) result['Payment Schedules'] = fields.paymentSchedules || '';
      if ('costCenter' in fields) result['Cost Center'] = fields.costCenter || '';
      if ('termsOfReferenceLink' in fields) result['Terms of Reference Link'] = fields.termsOfReferenceLink || '';
      break;

    case 'wos':
    case 'service':
      if ('serviceProviderName' in fields) result['Service Provider Name'] = fields.serviceProviderName || '';
      if ('positionTitle' in fields) result['Position Title'] = fields.positionTitle || '';
      if ('grossTechnicalServiceFee' in fields) result['Gross Technical Service Fee'] = formatCurrency(fields.grossTechnicalServiceFee || 0);
      if ('paymentSchedules' in fields) result['Payment Schedules'] = fields.paymentSchedules || '';
      if ('costCenter' in fields) result['Cost Center'] = fields.costCenter || '';
      if ('scopeOfWorkLink' in fields) result['Scope of Work Link'] = fields.scopeOfWorkLink || '';
      break;

    case 'moa_mou':
      if ('contractingPartyName' in fields) result['Contracting Party Name'] = fields.contractingPartyName || '';
      if ('registeredAddress' in fields) result['Registered Address'] = fields.registeredAddress || '';
      if ('authorizedRepresentative' in fields) result['Authorized Representative'] = fields.authorizedRepresentative || '';
      if ('authorizedRepresentativeDesignation' in fields) result['Authorized Rep. Designation'] = fields.authorizedRepresentativeDesignation || '';
      if ('recitals' in fields) result['Recitals'] = fields.recitals || '';
      if ('purpose' in fields) result['Purpose'] = fields.purpose || '';
      if ('kkpfiRoles' in fields) result['KKPFI Roles'] = fields.kkpfiRoles || '';
      if ('contractingPartyRoles' in fields) result['Contracting Party Roles'] = fields.contractingPartyRoles || '';
      if ('mutualObligations' in fields) result['Mutual Obligations'] = fields.mutualObligations || '';
      break;

    case 'employment':
      if ('positionTitle' in fields) result['Position Title'] = fields.positionTitle || '';
      if ('costCenter' in fields) result['Cost Center'] = fields.costCenter || '';
      if ('numberOfStaff' in fields) result['Number of Staff'] = String(fields.numberOfStaff || 0);
      if ('salaryRate' in fields) result['Salary Rate'] = formatCurrency(fields.salaryRate || 0);
      if ('communicationAllowance' in fields) result['Communication Allowance'] = formatCurrency(fields.communicationAllowance || 0);
      if ('requisitionReason' in fields) result['Requisition Reason'] = fields.requisitionReason || '';
      if ('replacementReason' in fields) result['Replacement Reason'] = fields.replacementReason || '';
      if ('employmentClassification' in fields) result['Employment Classification'] = fields.employmentClassification || '';
      if ('projectDurationMonths' in fields) result['Project Duration (Months)'] = String(fields.projectDurationMonths || 0);
      break;

    case 'amendment':
      if ('originalContractType' in fields) result['Original Contract Type'] = fields.originalContractType || '';
      if ('durationAmendment' in fields) result['Duration Amendment'] = fields.durationAmendment || '';
      if ('deliverablesAmendment' in fields) result['Deliverables Amendment'] = fields.deliverablesAmendment || '';
      if ('paymentAmendment' in fields) result['Payment Amendment'] = fields.paymentAmendment || '';
      if ('paymentSchedulesAmendment' in fields) result['Payment Schedules Amendment'] = fields.paymentSchedulesAmendment || '';
      break;

    case 'grant':
      if ('donorName' in fields) result['Donor Name'] = fields.donorName || '';
      if ('donorAddress' in fields) result['Donor Address'] = fields.donorAddress || '';
      if ('projectLocation' in fields) result['Project Location'] = fields.projectLocation || '';
      if ('primaryDonor' in fields) result['Primary Donor'] = fields.primaryDonor || '';
      if ('primaryDonorFundingSourceAgreementNumber' in fields) result['Primary Donor Funding Source Agreement #'] = fields.primaryDonorFundingSourceAgreementNumber || '';
      if ('contractAmount' in fields) result['Contract Amount'] = formatCurrency(fields.contractAmount || 0);
      if ('bankAccountInformation' in fields) result['Bank Account Information'] = fields.bankAccountInformation || '';
      if ('paymentSchedules' in fields) result['Payment Schedules'] = fields.paymentSchedules || '';
      if ('donorContacts' in fields) result['Donor Contacts'] = fields.donorContacts || '';
      if ('kkpfiContacts' in fields) result['KKPFI Contacts'] = fields.kkpfiContacts || '';
      if ('deliverables' in fields) result['Deliverables'] = fields.deliverables || '';
      if ('authorizedSignatoryName' in fields) result['Authorized Signatory Name'] = fields.authorizedSignatoryName || '';
      if ('authorizedSignatoryDesignation' in fields) result['Authorized Signatory Designation'] = fields.authorizedSignatoryDesignation || '';
      break;

    case 'subgrant':
      if ('recipientOrganizationName' in fields) result['Recipient Organization Name'] = fields.recipientOrganizationName || '';
      if ('recipientOrganizationAddress' in fields) result['Recipient Organization Address'] = fields.recipientOrganizationAddress || '';
      if ('recipientOrganizationContact' in fields) result['Recipient Organization Contact'] = fields.recipientOrganizationContact || '';
      if ('projectLocation' in fields) result['Project Location'] = fields.projectLocation || '';
      if ('primaryDonor' in fields) result['Primary Donor'] = fields.primaryDonor || '';
      if ('primaryDonorFundingSourceAgreementNumber' in fields) result['Primary Donor Funding Source Agreement #'] = fields.primaryDonorFundingSourceAgreementNumber || '';
      if ('contractAmount' in fields) result['Contract Amount'] = formatCurrency(fields.contractAmount || 0);
      if ('bankAccountInformation' in fields) result['Bank Account Information'] = fields.bankAccountInformation || '';
      if ('paymentSchedules' in fields) result['Payment Schedules'] = fields.paymentSchedules || '';
      if ('recipientOrganizationContacts' in fields) result['Recipient Organization Contacts'] = fields.recipientOrganizationContacts || '';
      if ('kkpfiContacts' in fields) result['KKPFI Contacts'] = fields.kkpfiContacts || '';
      if ('deliverables' in fields) result['Deliverables'] = fields.deliverables || '';
      if ('authorizedSignatoryName' in fields) result['Authorized Signatory Name'] = fields.authorizedSignatoryName || '';
      if ('authorizedSignatoryDesignation' in fields) result['Authorized Signatory Designation'] = fields.authorizedSignatoryDesignation || '';
      break;

    case 'lease':
      if ('lessorName' in fields) result['Lessor Name'] = fields.lessorName || '';
      if ('lessorAddress' in fields) result['Lessor Address'] = fields.lessorAddress || '';
      if ('propertyDescription' in fields) result['Property Description'] = fields.propertyDescription || '';
      if ('propertyAddress' in fields) result['Property Address'] = fields.propertyAddress || '';
      if ('leasePurpose' in fields) result['Lease Purpose'] = fields.leasePurpose || '';
      if ('monthlyRentalFee' in fields) result['Monthly Rental Fee'] = formatCurrency(fields.monthlyRentalFee || 0);
      if ('paymentDueDate' in fields) result['Payment Due Date'] = fields.paymentDueDate || '';
      if ('costCenter' in fields) result['Cost Center'] = fields.costCenter || '';
      break;

    case 'donation':
      if ('recipientOrganizationName' in fields) result['Recipient Organization Name'] = fields.recipientOrganizationName || '';
      if ('authorizedRepresentative' in fields) result['Authorized Representative'] = fields.authorizedRepresentative || '';
      if ('recipientAddress' in fields) result['Recipient Address'] = fields.recipientAddress || '';
      if ('transferPurpose' in fields) result['Transfer Purpose'] = fields.transferPurpose || '';
      if ('donatedItems' in fields) result['Donated Items'] = fields.donatedItems || '';
      if ('doneeObligations' in fields) result['Donee Obligations'] = fields.doneeObligations || '';
      break;
  }

  return result;
};

/**
 * Creates and styles a worksheet for a specific contract type
 * @param workbook Excel workbook
 * @param contractType Contract type
 * @param contracts List of contracts of this type
 * @returns The created worksheet
 */
const createTypeWorksheet = (
  workbook: ExcelJS.Workbook,
  contractType: ContractType,
  contracts: Contract[]
): ExcelJS.Worksheet => {
  // Get the type label for the worksheet name
  let typeLabel = contractTypeLabels[contractType] || contractType;

  // Sanitize worksheet name - Excel doesn't allow these characters: * ? : \ / [ ]
  typeLabel = typeLabel.replace(/[*?:\/\\\[\]]/g, '-');

  // Create a new worksheet
  const worksheet = workbook.addWorksheet(typeLabel);

  // Get all unique supporting document names from all contracts of this type
  const allSupportingDocNames = new Set<string>();
  contracts.forEach(contract => {
    if (contract.supportingDocuments && Array.isArray(contract.supportingDocuments)) {
      contract.supportingDocuments.forEach(doc => {
        allSupportingDocNames.add(`Doc: ${doc.name}`);
      });
    }
  });

  // Get all unique type-specific field names from all contracts of this type
  const typeSpecificFieldNames = new Set<string>();
  contracts.forEach(contract => {
    if (contract.typeSpecificFields) {
      const typeSpecificData = getTypeSpecificColumns(contract);
      Object.keys(typeSpecificData).forEach(key => {
        typeSpecificFieldNames.add(key);
      });
    }
  });

  // Define base columns
  const baseColumns: Partial<ExcelJS.Column>[] = [
    { header: 'Project Name', key: 'projectName', width: 25 },
    { header: 'Status', key: 'status', width: 20 },
    { header: 'Owner', key: 'owner', width: 25 },
    { header: 'Start Date', key: 'startDate', width: 15 },
    { header: 'End Date', key: 'endDate', width: 15 },
    { header: 'Value', key: 'value', width: 15 }
  ];

  // Add type-specific columns
  const typeSpecificColumns = Array.from(typeSpecificFieldNames).map(fieldName => ({
    header: fieldName,
    key: fieldName,
    width: 20
  }));

  // Add remaining columns
  const additionalColumns: Partial<ExcelJS.Column>[] = [
    { header: 'Created At', key: 'createdAt', width: 15 },
    { header: 'Updated At', key: 'updatedAt', width: 15 },
    { header: 'Description', key: 'description', width: 40 }
  ];

  // Add supporting document columns
  const docColumns = Array.from(allSupportingDocNames).map(docName => ({
    header: docName,
    key: docName,
    width: 15
  }));

  // Set all columns
  worksheet.columns = [...baseColumns, ...typeSpecificColumns, ...additionalColumns, ...docColumns];

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '4F46E5' } // Indigo color
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Add data rows
  contracts.forEach(contract => {
    // Get supporting document data
    const docData = getSupportingDocumentColumns(contract);

    // Get type-specific fields
    const typeSpecificData = getTypeSpecificColumns(contract);

    // Create row data
    const rowData = {
      projectName: contract.projectName,
      status: statusLabels[contract.status as ContractStatus] || contract.status,
      owner: contract.owner,
      startDate: formatDate(contract.startDate),
      endDate: formatDate(contract.endDate),
      value: formatCurrency(contract.value),
      createdAt: formatDate(contract.createdAt),
      updatedAt: formatDate(contract.updatedAt),
      description: contract.description,
      ...typeSpecificData,
      ...docData
    };

    worksheet.addRow(rowData);
  });

  // Style all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      if (rowNumber > 1) { // Not header row
        // Alternate row colors for better readability
        if (rowNumber % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F9FAFB' } // Light gray
          };
        }

        // Align dates and currency to right
        if (cell.column && cell.column.key) {
          if (['startDate', 'endDate', 'createdAt', 'updatedAt', 'value'].includes(cell.column.key)) {
            cell.alignment = { horizontal: 'right' };
          }

          // Center-align the supporting document checkboxes
          if (cell.column.key.startsWith('Doc:')) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            // Make checkmarks green and X marks red
            if (cell.value === '✓') {
              cell.font = { color: { argb: '00AA00' } }; // Green
            } else if (cell.value === '✗') {
              cell.font = { color: { argb: 'AA0000' } }; // Red
            }
          }
        }
      }
    });

    // Set row height
    row.height = 20;
  });

  return worksheet;
};

/**
 * Creates a summary worksheet with counts of each contract type
 * @param workbook Excel workbook
 * @param contractsByType Grouped contracts by type
 * @returns The created worksheet
 */
const createSummaryWorksheet = (
  workbook: ExcelJS.Workbook,
  contractsByType: Record<string, Contract[]>
): ExcelJS.Worksheet => {
  const worksheet = workbook.addWorksheet('Summary');

  // Define columns
  worksheet.columns = [
    { header: 'Contract Type', key: 'type', width: 30 },
    { header: 'Count', key: 'count', width: 15 }
  ];

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '4F46E5' } // Indigo color
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Add data rows
  let totalContracts = 0;

  Object.entries(contractsByType).forEach(([type, contracts]) => {
    let typeLabel = contractTypeLabels[type as ContractType] || type;
    // Sanitize type label for display (not for worksheet name, just for consistency)
    typeLabel = typeLabel.replace(/[*?:\/\\\[\]]/g, '-');
    const count = contracts.length;

    worksheet.addRow({
      type: typeLabel,
      count
    });

    totalContracts += count;
  });

  // Add total row
  const totalRow = worksheet.addRow({
    type: 'TOTAL',
    count: totalContracts
  });

  totalRow.font = { bold: true };
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'E5E7EB' } // Light gray
  };

  // Style all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      if (rowNumber > 1 && rowNumber < worksheet.rowCount) { // Not header or total row
        // Alternate row colors for better readability
        if (rowNumber % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F9FAFB' } // Light gray
          };
        }
      }

      // Right-align the count and value columns
      if (cell.column && cell.column.key && ['count', 'value'].includes(cell.column.key)) {
        cell.alignment = { horizontal: 'right' };
      }
    });

    // Set row height
    row.height = 20;
  });

  return worksheet;
};

/**
 * Exports contracts to an Excel file with multiple tabs (one per contract type)
 * @param contracts List of contracts to export
 * @param fileName Name of the file to download (without extension)
 */
export const exportContractsToExcel = async (
  contracts: Contract[],
  fileName: string = 'contracts-export'
): Promise<void> => {
  // Check if contracts array is empty
  if (!contracts || contracts.length === 0) {
    throw new Error('No contracts to export');
  }

  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Contract Management System';
  workbook.lastModifiedBy = 'Contract Management System';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Group contracts by type
  const contractsByType = groupBy(contracts, 'type');

  // Create a summary worksheet
  createSummaryWorksheet(workbook, contractsByType);

  // Create a worksheet for each contract type
  Object.entries(contractsByType).forEach(([type, typeContracts]) => {
    createTypeWorksheet(workbook, type as ContractType, typeContracts);
  });

  // Create an "All Contracts" worksheet with all contracts
  const allContractsWorksheet = workbook.addWorksheet('All Contracts');

  // Get all unique supporting document names from all contracts
  const allSupportingDocNames = new Set<string>();
  contracts.forEach(contract => {
    if (contract.supportingDocuments && Array.isArray(contract.supportingDocuments)) {
      contract.supportingDocuments.forEach(doc => {
        allSupportingDocNames.add(`Doc: ${doc.name}`);
      });
    }
  });

  // Get all unique type-specific field names from all contracts
  const allTypeSpecificFieldNames = new Set<string>();
  contracts.forEach(contract => {
    if (contract.typeSpecificFields) {
      const typeSpecificData = getTypeSpecificColumns(contract);
      Object.keys(typeSpecificData).forEach(key => {
        allTypeSpecificFieldNames.add(key);
      });
    }
  });

  // Define base columns for all contracts worksheet
  const baseColumns: Partial<ExcelJS.Column>[] = [
    { header: 'Project Name', key: 'projectName', width: 25 },
    { header: 'Type', key: 'type', width: 20 },
    { header: 'Status', key: 'status', width: 20 },
    { header: 'Owner', key: 'owner', width: 25 },
    { header: 'Start Date', key: 'startDate', width: 15 },
    { header: 'End Date', key: 'endDate', width: 15 },
    { header: 'Value', key: 'value', width: 15 }
  ];

  // Add type-specific columns
  const typeSpecificColumns = Array.from(allTypeSpecificFieldNames).map(fieldName => ({
    header: fieldName,
    key: fieldName,
    width: 20
  }));

  // Add remaining columns
  const additionalColumns: Partial<ExcelJS.Column>[] = [
    { header: 'Created At', key: 'createdAt', width: 15 },
    { header: 'Updated At', key: 'updatedAt', width: 15 },
    { header: 'Description', key: 'description', width: 40 }
  ];

  // Add supporting document columns
  const docColumns = Array.from(allSupportingDocNames).map(docName => ({
    header: docName,
    key: docName,
    width: 15
  }));

  // Set all columns for all contracts worksheet
  allContractsWorksheet.columns = [...baseColumns, ...typeSpecificColumns, ...additionalColumns, ...docColumns];

  // Style the header row
  const headerRow = allContractsWorksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '4F46E5' } // Indigo color
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Add data rows to all contracts worksheet
  contracts.forEach(contract => {
    // Get supporting document data
    const docData = getSupportingDocumentColumns(contract);

    // Get type-specific fields
    const typeSpecificData = getTypeSpecificColumns(contract);

    // Create row data
    const rowData = {
      projectName: contract.projectName,
      type: (contractTypeLabels[contract.type as ContractType] || contract.type).replace(/[*?:\/\\\[\]]/g, '-'),
      status: statusLabels[contract.status as ContractStatus] || contract.status,
      owner: contract.owner,
      startDate: formatDate(contract.startDate),
      endDate: formatDate(contract.endDate),
      value: formatCurrency(contract.value),
      createdAt: formatDate(contract.createdAt),
      updatedAt: formatDate(contract.updatedAt),
      description: contract.description,
      ...typeSpecificData,
      ...docData
    };

    allContractsWorksheet.addRow(rowData);
  });

  // Style all cells in all contracts worksheet
  allContractsWorksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      if (rowNumber > 1) { // Not header row
        // Alternate row colors for better readability
        if (rowNumber % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F9FAFB' } // Light gray
          };
        }

        // Align dates and currency to right
        if (cell.column && cell.column.key) {
          if (['startDate', 'endDate', 'createdAt', 'updatedAt', 'value'].includes(cell.column.key)) {
            cell.alignment = { horizontal: 'right' };
          }

          // Center-align the supporting document checkboxes
          if (cell.column.key.startsWith('Doc:')) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            // Make checkmarks green and X marks red
            if (cell.value === '✓') {
              cell.font = { color: { argb: '00AA00' } }; // Green
            } else if (cell.value === '✗') {
              cell.font = { color: { argb: 'AA0000' } }; // Red
            }
          }
        }
      }
    });

    // Set row height
    row.height = 20;
  });

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();

  // Save the file
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}.xlsx`);
};
