/** A module to manage the application configuration.
 * @module lib/Config
 */

export default {
    /** Ask for this number of tasks and projects per page (default: 20 in gitlab) */
    PROJECTS_PER_PAGE: 40,
    /** Name of the assigned_to_me parameter.
     *  If gitlab < 11, use "assigned-to-me". Else, use "assigned_to_me".
     */
    ASSIGNED_TO_ME: 'assigned-to-me',
    /** Update the session duration after these milliseconds */
    UPDATE_DURATION: 30000,
    /** List of important labels */
    IMPORTANT_LABELS: ["important", "relevant", "prioridad alta"],
    /** List of things-to-check labels */
    CHECK_LABELS: ["check", "warning"],
    /** list of already-seen labels */
    SEEN_LABELS: ["seen", "unimportant", "doing"],
}
