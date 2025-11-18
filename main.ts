/**
 * Use this file to define custom functions and blocks.
 * Read more at https://makecode.microbit.org/blocks/custom
 */

/**
 * Custom blocks
 */
//% weight=100 color=#0fbc11 icon="\uf0ac"
namespace timezoneDB {
  interface TimezoneInfo {
    utcOffset: number;
    hasDst: boolean;
  }

  const HEADER_SIZE = 8;
  let resLat = 0;
  let resLon = 0;
  let timezoneInfo = { utcOffset: 0, hasDst: false };

  function padNumber(num: number, size: number): string {
    let s = "" + num;
    while (s.length < size) {
      s = "0" + s;
    }
    return s;
  }

  /**
   */
  //% block
  export function setupTimezoneDatabase(): void {
    let address = 0;
    let data = w25q128.readData(address, HEADER_SIZE);

    let year = (data[0] << 8) | data[1];
    let month = data[2];
    let day = data[3];

    let numLat = (data[4] << 8) | data[5];
    let numLon = (data[6] << 8) | data[7];

    resLat = 180.0 / (numLat - 1);
    resLon = 360.0 / (numLon - 1);

    serial.writeLine(
      year.toString() +
        "-" +
        padNumber(month, 2) +
        "-" +
        padNumber(day, 2) +
        " numLat=" +
        numLat.toString() +
        " (res=" +
        resLat.toString() +
        ") numLon=" +
        numLon.toString() +
        " (res=" +
        resLon.toString() +
        ")"
    );
  }

  /**
   */
  //% block
  export function readTimezone(lat: number, lon: number): void {
    let latRoundToRes = Math.round(lat / resLat) * resLat;
    let lonRoundToRes = Math.round(lon / resLon) * resLon;
    let latIndex = Math.idiv((latRoundToRes + 90) / resLat, 1);
    let lonIndex = Math.idiv((lonRoundToRes + 180) / resLon, 1);
    let lonCount = 360 / resLon + 1;
    let coordinate_index = latIndex * lonCount + lonIndex;
    let flash_index = coordinate_index + HEADER_SIZE;

    let data = w25q128.readData(flash_index, 1);
    let hasDst = (data[0] & 0x1) == 1;
    let encodedOffset = (data[0] >> 1) & 0xff;
    let utcOffset = (encodedOffset - 48) / 2.0; // stored in half hours with an offset of 48 half hours

    timezoneInfo = {
      utcOffset: utcOffset,
      hasDst: hasDst,
    };
  }

  /**
   */
  //% block
  export function getTimezoneUtcOffset(): number {
    return timezoneInfo.utcOffset;
  }

  /**
   */
  //% block
  export function getTimezoneHasDst(): boolean {
    return timezoneInfo.hasDst;
  }

  /**
   */
  //% block
  export function printTimezone(
    lat: number,
    lon: number,
    location: string
  ): void {
    readTimezone(lat, lon);
    serial.writeLine(
      "timezone " +
        location +
        " (" +
        lat.toString() +
        ", " +
        lon.toString() +
        "): utcOffset=" +
        getTimezoneUtcOffset().toString() +
        ", has_dst=" +
        getTimezoneHasDst().toString()
    );
  }
}
