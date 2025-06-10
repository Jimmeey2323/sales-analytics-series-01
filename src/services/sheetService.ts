
interface Credentials {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  expiration_time: number;
}

class SheetService {
  private credentials: Credentials = {
    access_token: "",
    refresh_token: "1//04MmvT_BibTsBCgYIARAAGAQSNwF-L9IrG9yxJvvQRMLPR39xzWSrqfTVMkvq3WcZqsDO2HjUkV6s7vo1pQkex4qGF3DITTiweAA",
    expires_in: 3599,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    token_type: "Bearer",
    expiration_time: 0
  };

  private readonly CLIENT_ID = "416630995185-007ermh3iidknbbtdmu5vct207mdlbaa.apps.googleusercontent.com";
  private readonly CLIENT_SECRET = "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";
  private readonly SPREADSHEET_ID = "1GY78saGWgQLnuHeM3zwG01ahZ_2t0Y-WhNS2sz0PK4Q";
  private readonly SHEET_NAME = "◉ Sales";

  async refreshAccessToken(): Promise<void> {
    try {
      const formData = new URLSearchParams();
      formData.append("client_id", this.CLIENT_ID);
      formData.append("client_secret", this.CLIENT_SECRET);
      formData.append("refresh_token", this.credentials.refresh_token);
      formData.append("grant_type", "refresh_token");

      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData.toString()
      });

      const tokenData = await response.json();
      
      this.credentials.access_token = tokenData.access_token;
      this.credentials.expiration_time = Date.now() + tokenData.expires_in * 1000;
      
      localStorage.setItem("sheet_access_token", tokenData.access_token);
      localStorage.setItem("sheet_expiration_time", String(this.credentials.expiration_time));

    } catch (error) {
      console.error("Error refreshing access token:", error);
      throw error;
    }
  }

  async getAccessToken(): Promise<string> {
    // Try to get from localStorage first
    const storedToken = localStorage.getItem("sheet_access_token");
    const storedExpiration = localStorage.getItem("sheet_expiration_time");
    
    if (storedToken && storedExpiration) {
      this.credentials.access_token = storedToken;
      this.credentials.expiration_time = parseInt(storedExpiration, 10);
    }
    
    // Check if token needs refresh
    if (!this.credentials.access_token || Date.now() > this.credentials.expiration_time) {
      await this.refreshAccessToken();
    }
    
    return this.credentials.access_token;
  }

  async fetchSalesData(): Promise<any[]> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.SPREADSHEET_ID}/values/${this.SHEET_NAME}!A:Z`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.values || result.values.length <= 1) {
        return [];
      }

      // Convert to array of objects with headers as keys
      const headers = result.values[0];
      const data = result.values.slice(1).map((row: any) => {
        const item: Record<string, any> = {};
        headers.forEach((header: string, index: number) => {
          item[header] = row[index] || "";
        });
        return item;
      });
      
      // Add additional computed fields for analysis
      return data.map((item: any) => {
        // Extract month and year for month-on-month analysis
        const date = this.parseDate(item["Payment Date"]);
        if (date) {
          item["Month"] = date.getMonth() + 1;
          item["Year"] = date.getFullYear();
          item["MonthYear"] = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        }
        
        // Calculate tax amount if not available
        if (item["Payment VAT"] && !isNaN(parseFloat(item["Payment VAT"]))) {
          item["Tax Amount"] = parseFloat(item["Payment VAT"]);
        } else if (item["Payment Value"]) {
          // Assume tax is 18% if not provided
          const value = parseFloat(item["Payment Value"]) || 0;
          item["Tax Amount"] = value * 0.18;
        }
        
        // Calculate post-tax revenue
        const value = parseFloat(item["Payment Value"]) || 0;
        const tax = parseFloat(item["Tax Amount"]) || 0;
        item["Revenue Post Tax"] = value;
        item["Revenue Pre Tax"] = value - tax;
        
        // Identify the sales associate
        item["Sales Associate"] = item["Sold By"] || "Unknown";
        
        return item;
      });
      
    } catch (error) {
      console.error("Error fetching sales data:", error);
      throw error;
    }
  }

  private parseDate(dateString: string): Date | null {
    if (!dateString) return null;
    
    // Try different date formats
    // Format: DD/MM/YYYY HH:mm:ss
    const formats = [
      /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/,  // DD/MM/YYYY HH:mm:ss
      /(\d{2})\/(\d{2})\/(\d{4})/,  // DD/MM/YYYY
      /(\d{4})-(\d{2})-(\d{2})/     // YYYY-MM-DD
    ];
    
    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        if (match.length === 7) {
          // DD/MM/YYYY HH:mm:ss
          return new Date(
            parseInt(match[3], 10),
            parseInt(match[2], 10) - 1,
            parseInt(match[1], 10),
            parseInt(match[4], 10),
            parseInt(match[5], 10),
            parseInt(match[6], 10)
          );
        } else if (match.length === 4) {
          // DD/MM/YYYY
          return new Date(
            parseInt(match[3], 10),
            parseInt(match[2], 10) - 1,
            parseInt(match[1], 10)
          );
        } else if (match.length === 4) {
          // YYYY-MM-DD
          return new Date(
            parseInt(match[1], 10),
            parseInt(match[2], 10) - 1,
            parseInt(match[3], 10)
          );
        }
      }
    }
    
    // Last resort, try standard parsing
    const parsedDate = new Date(dateString);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }
}

const sheetService = new SheetService();
export default sheetService;
